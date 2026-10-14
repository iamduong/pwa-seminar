from datetime import UTC, datetime
from random import randint

from model.admin_user_model import AdminUserModel
from pymongo.asynchronous.database import AsyncDatabase


async def init_admin_user(db: AsyncDatabase):
    collection = db["admin_user"]

    admin_users: list[AdminUserModel] = [
        AdminUserModel(
            full_name="Lâm Vinh Đạt",
            email="lamvinhdat@gmail.com",
            phone="0969297300",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Trần Thanh Quy",
            email="thanhquyfu@gmail.com",
            phone="0969297301",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Nguyễn Minh Anh",
            email="nguyenminhanh@gmail.com",
            phone="0969297302",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Lê Hoàng Nam",
            email="lehoangnam@gmail.com",
            phone="0969297303",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Phạm Thu Hà",
            email="phamthuha@gmail.com",
            phone="0969297304",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Võ Đức Huy",
            email="voduchuy@gmail.com",
            phone="0969297305",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Đặng Ngọc Mai",
            email="dangngocmai@gmail.com",
            phone="0969297306",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Bùi Quốc Bảo",
            email="buiquocbao@gmail.com",
            phone="0969297307",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Đỗ Khánh Linh",
            email="dokhanhlinh@gmail.com",
            phone="0969297308",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
        AdminUserModel(
            full_name="Hoàng Gia Phúc",
            email="hoanggiaphuc@gmail.com",
            phone="0969297309",
            password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=f"v1:fake-id-card-encrypted-{randint(1, 1000)}",
            pii_collected_at=datetime.now(UTC),
        ),
    ]

    documents = [admin_user.model_dump(by_alias=True) for admin_user in admin_users]
    result = await collection.insert_many(documents=documents)

    print(result.inserted_ids)
