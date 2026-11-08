import sys
import os
import unittest
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
os.environ.setdefault(
    "POSTGRES_ENDPOINT", "postgresql+psycopg://postgres:postgres@localhost/test"
)
os.environ.setdefault("POSTGRES_DATABASE", "test")

from fastapi import HTTPException
from pydantic import ValidationError

from model.menu_item_model import MenuItemModel
from schema.menu_item_schema import MenuItemSave
from service.menu_item_service import MenuItemService


def persisted_item(**changes):
    now = datetime.now(UTC)
    values = {
        "id": uuid4(),
        "poi_id": uuid4(),
        "name": "Cơm tấm",
        "description": None,
        "price": 0,
        "image_url": None,
        "is_active": False,
        "is_available": True,
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
        self.service.pois.find_owned.return_value = [
            SimpleNamespace(id=self.poi_id, name="Quán")
        ]
        self.body = MenuItemSave(
            poi_id=str(self.poi_id), name="  Cơm tấm  ", price=0
        )

    async def test_create_directly_inactive(self):
        self.service.repository.find_pending_duplicate.return_value = None

        async def insert(item: MenuItemModel):
            return persisted_item(
                poi_id=item.poi_id,
                name=item.name,
                description=item.description,
                price=item.price,
                image_url=item.image_url,
                is_active=item.is_active,
            )

        self.service.repository.insert.side_effect = insert
        view = await self.service.create(str(self.owner_id), self.body)
        self.assertFalse(view.is_active)
        self.assertEqual(view.name, "Cơm tấm")
        self.assertEqual(view.price, 0)

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
        for changes in ({"name": "  "}, {"price": -1}, {"price": float("nan")}):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                MenuItemSave.model_validate(self.body.model_dump() | changes)
        body = MenuItemSave.model_validate(self.body.model_dump() | {"is_active": True})
        self.assertNotIn("is_active", body.model_dump())


if __name__ == "__main__":
    unittest.main()
