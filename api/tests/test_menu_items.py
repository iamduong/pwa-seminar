import sys
import os
import unittest
import asyncio
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
os.environ.setdefault(
    "POSTGRES_ENDPOINT", "postgresql+psycopg://postgres:postgres@localhost/test"
)
os.environ.setdefault("POSTGRES_DATABASE", "test")

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from model.menu_item_localization_model import MenuItemLocalizationModel
from model.menu_item_model import MenuItemModel
from model.content_dataset_version_model import ContentDatasetVersionModel
from resource.config import MY_MEMORY_LANGUAGES
from schema.menu_item_schema import MenuItemCreate, MenuItemSave, MenuTranslationFilter
from service.menu_item_service import MenuItemService
from core.dependency import validate_session
from router.menu_item_router import router as menu_router
from util.menu_item_worker import _claim_translation, _finish_translation, _translate_item, process_menu_item_worker
from util.translator import TranslationError


def persisted_item(**changes):
    now = datetime.now(UTC)
    values = {
        "id": uuid4(),
        "poi_id": uuid4(),
        "name": "Cơm tấm",
        "description": None,
        "image_url": None,
        "is_active": False,
        "is_available": False,
        "created_at": now,
        "updated_at": now,
    } | changes
    return SimpleNamespace(**values)


class MenuItemTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.owner_id = uuid4()
        self.poi_id = uuid4()
        self.service = object.__new__(MenuItemService)
        self.service.repository = AsyncMock()
        self.service.pois = AsyncMock()
        self.service.dataset_versions = AsyncMock()
        self.service.pois.find_owned.return_value = [
            SimpleNamespace(id=self.poi_id, name="Quán")
        ]
        self.body = MenuItemSave(
            poi_id=str(self.poi_id), name="  Cơm tấm  "
        )

    async def test_create_directly_inactive(self):
        self.service.repository.find_pending_duplicate.return_value = None

        async def insert(item: MenuItemModel):
            return persisted_item(
                poi_id=item.poi_id,
                name=item.name,
                description=item.description,
                image_url=item.image_url,
                is_active=item.is_active,
                is_available=item.is_available,
            )

        self.service.repository.insert.side_effect = insert
        view = await self.service.create(str(self.owner_id), self.body)
        self.assertFalse(view.is_active)
        self.assertEqual(view.name, "Cơm tấm")
        self.assertFalse(view.is_available)
        self.assertNotIn("price", view.model_dump())

    async def test_create_rejects_foreign_poi(self):
        self.service.pois.find_owned.return_value = []
        with self.assertRaises(HTTPException) as error:
            await self.service.create(str(self.owner_id), self.body)
        self.assertEqual(error.exception.status_code, 404)
        self.service.repository.insert.assert_not_awaited()

    async def test_duplicate_pending_item(self):
        self.service.repository.find_pending_duplicate.return_value = persisted_item()
        with self.assertRaises(HTTPException) as error:
            await self.service.create(str(self.owner_id), self.body)
        self.assertEqual(error.exception.status_code, 409)

    async def test_public_menu_requires_active_poi(self):
        self.service.pois.find_by_id.return_value = None
        with self.assertRaises(HTTPException):
            await self.service.list_public(str(self.poi_id))
        self.service.pois.find_by_id.assert_awaited_once_with(
            self.poi_id, active=True
        )

    def test_validation_and_approval_cannot_be_supplied_by_owner(self):
        for changes in ({"name": "  "}, {"name": "a"}):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                MenuItemSave.model_validate(self.body.model_dump() | changes)
        body = MenuItemSave.model_validate(self.body.model_dump() | {"is_active": True, "is_available": True, "price": 100})
        for field in ("is_active", "is_available", "price"):
            self.assertNotIn(field, body.model_dump())


class MenuTranslationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # SQLite exercises the actual SQL and transactions without external services.
        self.engine = create_engine("sqlite://")
        MenuItemModel.__table__.create(self.engine)
        MenuItemLocalizationModel.__table__.create(self.engine)
        ContentDatasetVersionModel.__table__.create(self.engine)
        self.session = Session(self.engine, expire_on_commit=False)
        self.db = AsyncMock(spec=AsyncSession)
        for method in ("execute", "scalars", "scalar", "merge", "commit", "refresh", "flush", "rollback"):
            getattr(self.db, method).side_effect = getattr(self.session, method)
        self.db.add.side_effect = self.session.add
        self.db.add_all.side_effect = self.session.add_all
        self.db.__aenter__.return_value = self.db
        self.factory = Mock(return_value=self.db)
        self.poi_id, self.owner_id = uuid4(), uuid4()
        self.service = MenuItemService(self.db)
        self.service.pois = AsyncMock()
        poi = SimpleNamespace(id=self.poi_id, name="Quán")
        self.service.pois.find_by_id.return_value = poi
        self.service.pois.find_owned.return_value = [poi]
        self.item = MenuItemModel(poi_id=self.poi_id, name="Cơm tấm", description="Món cơm", is_active=False, is_available=False)
        self.session.add(self.item)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    async def approve(self):
        return await self.service.approve_item(str(self.poi_id), str(self.item.id))

    def rows(self):
        return list(self.session.scalars(select(MenuItemLocalizationModel)).all())

    async def finish_all(self):
        while claimed := await _claim_translation(self.factory):
            localization, item = claimed
            await _finish_translation(self.db, localization, f"Translated {item.name}", "Translated description", None)

    async def test_approval_queues_all_languages_without_publishing(self):
        view = await self.approve()
        self.assertTrue(view.is_active)
        self.assertFalse(view.is_available)
        self.assertEqual({row.lang for row in self.rows()}, set(MY_MEMORY_LANGUAGES))
        self.assertTrue(all(row.translation_status == "pending" for row in self.rows()))

    async def test_repeated_approval_does_not_replace_translations(self):
        await self.approve()
        ids = {row.id for row in self.rows()}
        await self.finish_all()
        view = await self.approve()
        self.assertTrue(view.is_available)
        self.assertEqual({row.id for row in self.rows()}, ids)

    async def test_approval_rejects_wrong_poi(self):
        self.service.pois.find_by_id.return_value = SimpleNamespace(id=uuid4())
        with self.assertRaises(HTTPException) as caught:
            await self.approve()
        self.assertEqual(caught.exception.status_code, 404)
        self.assertEqual(self.rows(), [])

    async def test_admin_creation_also_waits_for_translation(self):
        view = await self.service.create_direct(str(self.poi_id), MenuItemCreate(name="Phở bò"))
        self.assertTrue(view.is_active)
        self.assertFalse(view.is_available)
        self.assertEqual(len(self.rows()), len(MY_MEMORY_LANGUAGES))

    async def test_edit_hides_item_and_physically_removes_old_translations(self):
        await self.approve()
        await self.finish_all()
        old_ids = {row.id for row in self.rows()}
        view = await self.service.update(str(self.owner_id), str(self.item.id), MenuItemSave(poi_id=str(self.poi_id), name="Món mới"))
        self.assertFalse(view.is_active)
        self.assertFalse(view.is_available)
        self.assertEqual(self.rows(), [])
        await self.approve()
        self.assertTrue(old_ids.isdisjoint(row.id for row in self.rows()))
        self.assertTrue(all(row.name == "Món mới" for row in self.rows()))

    async def test_foreign_owner_cannot_clear_translations(self):
        await self.approve()
        self.service.pois.find_owned.return_value = []
        with self.assertRaises(HTTPException):
            await self.service.update(str(self.owner_id), str(self.item.id), MenuItemSave(poi_id=str(self.poi_id), name="Món mới"))
        self.assertEqual(len(self.rows()), len(MY_MEMORY_LANGUAGES))
        self.assertTrue(self.item.is_active)

    async def test_old_worker_cannot_publish_after_edit_and_reapproval(self):
        await self.approve()
        old_claim, _ = await _claim_translation(self.factory)
        await self.service.update(str(self.owner_id), str(self.item.id), MenuItemSave(poi_id=str(self.poi_id), name="Món mới"))
        await self.approve()
        await _finish_translation(self.db, old_claim, "OLD RESULT", "OLD DESCRIPTION", None)
        self.assertFalse(self.item.is_available)
        self.assertTrue(all(row.translation_status == "pending" and row.name == "Món mới" for row in self.rows()))

    async def test_publish_only_after_every_language_is_ready(self):
        await self.approve()
        claim, _ = await _claim_translation(self.factory)
        await _finish_translation(self.db, claim, "Translated", None, None)
        self.assertFalse(self.item.is_available)
        await self.finish_all()
        self.assertTrue(self.item.is_available)

    async def test_interrupted_claim_recovers_and_rejects_previous_worker(self):
        await self.approve()
        self.session.query(MenuItemLocalizationModel).update({"translation_status": "ready"})
        row = self.rows()[0]
        row.translation_status = "processing"
        row.updated_at = datetime.now(UTC) - timedelta(seconds=121)
        self.session.commit()
        old_claim = SimpleNamespace(id=row.id, menu_item_id=row.menu_item_id, updated_at=row.updated_at)
        claim, _ = await _claim_translation(self.factory)
        self.assertEqual(claim.id, old_claim.id)
        await _finish_translation(self.db, old_claim, "OLD RESULT", None, None)
        self.assertEqual(claim.translation_status, "processing")
        await _finish_translation(self.db, claim, "NEW RESULT", None, None)
        self.assertTrue(self.item.is_available)
        self.assertEqual(self.rows()[0].name, "NEW RESULT")

    async def test_active_claim_is_not_claimed_twice(self):
        await self.approve()
        ids = [(await _claim_translation(self.factory))[0].id for _ in MY_MEMORY_LANGUAGES]
        self.assertEqual(len(set(ids)), len(MY_MEMORY_LANGUAGES))
        self.assertIsNone(await _claim_translation(self.factory))

    async def test_missing_language_does_not_publish(self):
        await self.approve()
        self.session.delete(self.rows()[0])
        self.session.commit()
        await self.finish_all()
        self.assertFalse(self.item.is_available)

    async def test_failed_translation_stays_hidden_and_retries_only_failed_language(self):
        await self.approve()
        claim, _ = await _claim_translation(self.factory)
        await _finish_translation(self.db, claim, self.item.name, self.item.description, "Service unavailable")
        await self.finish_all()
        self.assertFalse(self.item.is_available)
        done_ids = {row.id for row in self.rows() if row.translation_status == "ready"}
        result = await self.service.retry_translations(str(self.item.id))
        self.assertEqual(result.status, "queued")
        self.assertEqual({row.id for row in self.rows() if row.translation_status == "ready"}, done_ids)
        await self.finish_all()
        self.assertTrue(self.item.is_available)

    async def test_retry_rejects_unapproved_and_completed_items(self):
        for approved in (False, True):
            if approved:
                await self.approve()
                await self.finish_all()
            with self.subTest(approved=approved), self.assertRaises(HTTPException) as caught:
                await self.service.retry_translations(str(self.item.id))
            self.assertEqual(caught.exception.status_code, 409)

    async def test_public_menu_uses_requested_ready_language(self):
        await self.approve()
        self.assertEqual(await self.service.list_public(str(self.poi_id), "en-US"), [])
        await self.finish_all()
        result = await self.service.list_public(str(self.poi_id), "en-US")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].name, "Translated Cơm tấm")
        with self.assertRaises(HTTPException):
            await self.service.list_public(str(self.poi_id), "invalid")

    async def test_monitor_status_filters_and_progress(self):
        await self.approve()
        result = await self.service.list_translation_tasks(MenuTranslationFilter(status="queued"))
        self.assertEqual(result.total_item, 1)
        self.assertEqual(result.data[0].progress_percent, 0)
        claim, _ = await _claim_translation(self.factory)
        result = await self.service.list_translation_tasks(MenuTranslationFilter(status="running"))
        self.assertEqual(result.total_item, 1)
        await _finish_translation(self.db, claim, self.item.name, None, "Failed")
        await self.finish_all()
        result = await self.service.list_translation_tasks(MenuTranslationFilter(status="failed"))
        self.assertEqual(result.total_item, 1)
        self.assertEqual(result.data[0].progress_percent, 80)
        await self.service.retry_translations(str(self.item.id))
        await self.finish_all()
        result = await self.service.list_translation_tasks(MenuTranslationFilter(status="done"))
        self.assertEqual(result.data[0].progress_percent, 100)

    async def test_source_language_and_empty_description_do_not_call_translation(self):
        with patch("util.menu_item_worker.translate", new_callable=AsyncMock, return_value="Rice") as translate:
            self.assertEqual(await _translate_item(self.item, "vi-VN"), ("Cơm tấm", "Món cơm"))
            translate.assert_not_awaited()
            self.item.description = None
            self.assertEqual(await _translate_item(self.item, "en-US"), ("Rice", None))
            translate.assert_awaited_once_with("Cơm tấm", "vi-VN", "en-US")

    async def test_worker_failure_is_persisted_for_monitor(self):
        await self.approve()
        stop = asyncio.Event()
        finish = _finish_translation

        async def finish_and_stop(*args):
            await finish(*args)
            stop.set()

        with self.assertLogs("util.menu_item_worker", level="ERROR"), patch("util.menu_item_worker._translate_item", new_callable=AsyncMock, side_effect=TranslationError("offline")), patch("util.menu_item_worker._finish_translation", side_effect=finish_and_stop):
            await process_menu_item_worker(self.factory, stop)
        self.assertEqual(sum(row.translation_status == "failed" for row in self.rows()), 1)
        self.assertFalse(self.item.is_available)


class MenuTranslationApiTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(menu_router)
        self.service = AsyncMock(spec=MenuItemService)
        self.service.list_translation_tasks.return_value = {
            "page": 1, "page_size": 20, "total_item": 0, "total_page": 0, "data": [],
        }
        self.app.dependency_overrides[MenuItemService] = lambda: self.service
        self.client = TestClient(self.app)

    def permissions(self, values):
        self.app.dependency_overrides[validate_session] = lambda: SimpleNamespace(permissions=values)

    def test_monitor_requires_login(self):
        self.assertEqual(self.client.get("/menu-items/translations").status_code, 401)
        self.service.list_translation_tasks.assert_not_awaited()

    def test_owner_cannot_monitor_or_retry(self):
        self.permissions(["owner:menu_read", "owner:menu_submit"])
        self.assertEqual(self.client.get("/menu-items/translations").status_code, 403)
        self.assertEqual(self.client.post(f"/menu-items/{uuid4()}/translations/retry").status_code, 403)
        self.service.list_translation_tasks.assert_not_awaited()
        self.service.retry_translations.assert_not_awaited()

    def test_menu_reader_can_monitor_but_cannot_retry(self):
        self.permissions(["menu:read"])
        response = self.client.get("/menu-items/translations?status=running")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["total_item"], 0)
        self.assertEqual(self.service.list_translation_tasks.call_args.args[0].status, "running")
        self.assertEqual(self.client.post(f"/menu-items/{uuid4()}/translations/retry").status_code, 403)

    def test_monitor_rejects_invalid_filter(self):
        self.permissions(["menu:read"])
        for query in ("status=invalid", "page=0", "page_size=101"):
            with self.subTest(query=query):
                self.assertEqual(self.client.get(f"/menu-items/translations?{query}").status_code, 422)
        self.service.list_translation_tasks.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
