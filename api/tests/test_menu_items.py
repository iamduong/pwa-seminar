import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from bson import ObjectId
from cryptography.fernet import Fernet
from fastapi import HTTPException
from pydantic import ValidationError

# Import the service without requiring deployment secrets or database connections.
with patch("core.setting.get_setting", return_value=SimpleNamespace(
    PII_ENCRYPTION_KEY=Fernet.generate_key().decode(),
)):
    from service.menu_item_service import MenuItemService

from model.menu_item_model import MenuItemModel
from schema.menu_item_schema import MenuItemSave


class MenuItemTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.owner_id = str(ObjectId())
        self.poi_id = ObjectId()
        self.db = MagicMock()
        self.db["poi"].find_one = AsyncMock(return_value={"_id": self.poi_id})
        self.service = MenuItemService(self.db)
        self.assertIs(self.service.repository.collection, self.db["menu_item"])
        self.service.repository = AsyncMock()
        self.body = MenuItemSave(poi_id=str(self.poi_id), name="  Cơm tấm  ", price=0)

    async def test_create_directly_inactive(self):
        self.service.repository.find_one.return_value = None
        self.service.repository.insert_item.return_value = SimpleNamespace(inserted_id=ObjectId())
        view = await self.service.create(self.owner_id, self.body)
        document = self.service.repository.insert_item.call_args.args[0]
        self.assertFalse(document["is_active"])
        self.assertFalse(view.is_active)
        self.assertEqual(document["name"], "Cơm tấm")
        self.assertEqual(document["price"], 0)

    async def test_create_rejects_foreign_poi(self):
        self.db["poi"].find_one.return_value = None
        with self.assertRaises(HTTPException) as error:
            await self.service.create(self.owner_id, self.body)
        self.assertEqual(error.exception.status_code, 404)
        self.service.repository.insert_item.assert_not_awaited()

    async def test_duplicate_pending_item(self):
        self.service.repository.find_one.return_value = MenuItemModel(poi_id=self.poi_id, name="Cơm tấm")
        with self.assertRaises(HTTPException) as error:
            await self.service.create(self.owner_id, self.body)
        self.assertEqual(error.exception.status_code, 409)

    async def test_edit_resets_approval_and_preserves_availability(self):
        item = MenuItemModel(poi_id=self.poi_id, name="Cơm tấm", is_active=True, is_available=False)
        self.service.repository.find_one.side_effect = [item, item.model_copy(update={"is_active": False})]
        self.service.repository.update_item.return_value = SimpleNamespace(matched_count=1)
        view = await self.service.update(self.owner_id, str(item.id), self.body)
        item_id, poi_id, changes = self.service.repository.update_item.call_args.args
        self.assertEqual((item_id, poi_id), (item.id, self.poi_id))
        self.assertFalse(changes["is_active"])
        self.assertNotIn("is_available", changes)
        self.assertFalse(view.is_active)
        self.assertFalse(view.is_available)

    async def test_edit_rejects_foreign_item_or_destination(self):
        item = MenuItemModel(poi_id=self.poi_id, name="Cơm tấm")
        self.service.repository.find_one.return_value = item
        for ownership_results in ([None], [{"_id": self.poi_id}, None]):
            with self.subTest(ownership_results=ownership_results):
                self.db["poi"].find_one.side_effect = ownership_results
                with self.assertRaises(HTTPException) as error:
                    await self.service.update(self.owner_id, str(item.id), self.body)
                self.assertEqual(error.exception.status_code, 404)
                self.service.repository.update_item.assert_not_awaited()

    async def test_owner_list_includes_pending_items_only_at_owned_pois(self):
        self.service.list_owned_pois = AsyncMock(return_value=[{"id": str(self.poi_id), "name": "Quán"}])
        self.service.repository.find_many.return_value = []
        await self.service.list_self(self.owner_id)
        self.service.repository.find_many.assert_awaited_once_with({
            "poi_id": {"$in": [self.poi_id]}, "deleted_at": None,
        })

    async def test_public_menu_requires_approved_available_items(self):
        self.service.repository.find_many.return_value = []
        await self.service.list_public(str(self.poi_id))
        self.db["poi"].find_one.assert_awaited_once_with({
            "_id": self.poi_id, "is_active": True, "deleted_at": None,
        })
        self.service.repository.find_many.assert_awaited_once_with({
            "poi_id": self.poi_id, "is_active": True, "is_available": True, "deleted_at": None,
        })

    async def test_public_menu_rejects_hidden_poi(self):
        self.db["poi"].find_one.return_value = None
        with self.assertRaises(HTTPException):
            await self.service.list_public(str(self.poi_id))
        self.service.repository.find_many.assert_not_awaited()

    def test_validation_and_approval_cannot_be_supplied_by_owner(self):
        for changes in ({"name": "  "}, {"price": -1}, {"price": float("nan")}):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                MenuItemSave.model_validate(self.body.model_dump() | changes)
        body = MenuItemSave.model_validate(self.body.model_dump() | {"is_active": True})
        self.assertNotIn("is_active", body.model_dump())
        self.assertFalse(MenuItemModel(poi_id=self.poi_id, name="Món cũ").is_active)


if __name__ == "__main__":
    unittest.main()
