import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from schema.admin_user_schema import CreateAdminUser, UpdateAdminUser
from service.admin_user_service import AdminUserService
from core.dependency import validate_session


class AdminUserManagementTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.role = SimpleNamespace(id=uuid4(), name="editor", permissions=["user:read"], deleted_at=None)
        self.user = SimpleNamespace(id=uuid4(), full_name="Old name", email="user@example.com", phone="0901234567", is_active=True, is_poi_owner_verified=True, role_id=self.role.id, deleted_at=None)
        self.service = AdminUserService.__new__(AdminUserService)
        self.service.users = SimpleNamespace(find_by_id=AsyncMock(return_value=self.user), update=AsyncMock(side_effect=lambda user: user), find_by_email_or_phone=AsyncMock(return_value=None), insert=AsyncMock(side_effect=lambda user: user))
        self.service.roles = SimpleNamespace(find_by_id=AsyncMock(return_value=self.role))

    def test_contacts_and_verification_cannot_be_updated(self):
        for field, value in [("email", "other@example.com"), ("phone", "0999999999"), ("is_poi_owner_verified", False)]:
            with self.subTest(field=field), self.assertRaises(ValidationError):
                UpdateAdminUser(full_name="New name", role_id=self.role.id, is_active=False, **{field: value})

    def test_create_requires_role_and_preserves_password(self):
        payload = dict(full_name="  New name  ", email="new@example.com", phone="0901234567", password=" password ")
        with self.assertRaises(ValidationError):
            CreateAdminUser(**payload)
        body = CreateAdminUser(**payload, role_id=self.role.id)
        self.assertEqual(body.full_name, "New name")
        self.assertEqual(body.password, " password ")

    async def test_update_changes_only_allowed_fields(self):
        new_role = uuid4()
        self.role.id = new_role
        result = await self.service.update_admin_user(str(self.user.id), UpdateAdminUser(full_name="New name", role_id=new_role, is_active=False))
        self.assertEqual(result.full_name, "New name")
        self.assertFalse(result.is_active)
        self.assertEqual(result.role_id, str(new_role))
        self.assertEqual(result.email, "user@example.com")
        self.assertEqual(result.phone, "0901234567")
        self.assertTrue(result.is_poi_owner_verified)

    async def test_unknown_role_does_not_modify_user(self):
        self.service.roles.find_by_id.return_value = None
        with self.assertRaises(HTTPException) as caught:
            await self.service.update_admin_user(str(self.user.id), UpdateAdminUser(full_name="New name", role_id=uuid4(), is_active=False))
        self.assertEqual(caught.exception.status_code, 400)
        self.service.users.update.assert_not_awaited()
        self.assertTrue(self.user.is_active)

    async def test_create_uses_selected_role_and_status(self):
        body = CreateAdminUser(full_name="New name", email="new@example.com", phone="0901234567", password="password123", role_id=self.role.id, is_active=False)
        async def insert(user):
            user.id = uuid4()
            return user
        self.service.users.insert.side_effect = insert
        with patch("service.admin_user_service.hash_password", return_value="hashed"):
            result = await self.service.create_admin_user(body)
        self.assertEqual(result.role_id, str(self.role.id))
        self.assertFalse(result.is_active)
        self.assertFalse(result.is_poi_owner_verified)

    async def test_session_uses_current_role_not_token_permissions(self):
        payload = dict(sub=str(self.user.id), type="access", role_name="old", permissions=["user:update"], is_poi_owner_verified=False, iat=1, exp=9999999999)
        db = SimpleNamespace(get=AsyncMock(side_effect=[self.user, self.role]))
        with patch("core.dependency.decode_token", return_value=payload):
            result = await validate_session(SimpleNamespace(cookies={"access_token": "token"}), db)
        self.assertEqual(result.permissions, ["user:read"])
        self.assertTrue(result.is_poi_owner_verified)

    async def test_locked_user_cannot_use_existing_token(self):
        self.user.is_active = False
        payload = dict(sub=str(self.user.id), type="access", role_name="old", permissions=["user:update"], is_poi_owner_verified=False, iat=1, exp=9999999999)
        db = SimpleNamespace(get=AsyncMock(return_value=self.user))
        with patch("core.dependency.decode_token", return_value=payload), self.assertRaises(HTTPException) as caught:
            await validate_session(SimpleNamespace(cookies={"access_token": "token"}), db)
        self.assertEqual(caught.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
