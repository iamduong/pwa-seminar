"""Non-destructive fixtures for the admin menu workflow."""

from bson import ObjectId
from model.menu_item_model import MenuItemModel
from model.poi_category_model import PoiCategoryModel
from model.poi_model import GeoPointModel, PoiModel
from pymongo.asynchronous.database import AsyncDatabase


def fixture_id(number: int) -> ObjectId:
    return ObjectId(f"7e57ca1100000000{number:08x}")


def build_fixtures() -> dict[str, list[dict]]:
    category = PoiCategoryModel(id=fixture_id(1), name="Ẩm thực")
    pois = [
        PoiModel(
            id=fixture_id(10 + index),
            category_id=category.id,
            category_name=category.name,
            name=name,
            description="Món ngon sẵn sàng phục vụ.",
            address=address,
            location=GeoPointModel(coordinates=[106.7009, 10.7769]),
            images=[],
            # Admin can manage these POIs without publishing unfinished content.
            is_active=False,
            activation_requested=False,
        )
        for index, (name, address) in enumerate([
            ("Phở 24h", "206 Nguyễn Trãi, Quận 1, TP.HCM"),
            ("Cơm tấm 67", "99 Võ Văn Tần, Quận 3, TP.HCM"),
        ])
    ]
    items = [
        MenuItemModel(
            id=fixture_id(100 + index),
            poi_id=pois[0].id,
            name=f"Phở chờ duyệt {index + 1:02d}",
            description=None if index == 0 else "Món mẫu để kiểm tra duyệt và phân trang.",
            price=None if index == 0 else (0 if index == 1 else 45000 + index * 1000),
            is_active=False,
            is_available=index % 3 != 0,
        )
        for index in range(25)
    ]
    for index, (poi, name, approved, available) in enumerate([
        (pois[0], "Phở bò đã duyệt", True, True),
        (pois[0], "Phở gà tạm ngưng", True, False),
        (pois[0], "Trà đá", True, True),
        (pois[1], "Cơm sườn chờ duyệt", False, True),
        (pois[1], "Cơm gà đã duyệt", True, True),
    ]):
        items.append(MenuItemModel(
            id=fixture_id(200 + index),
            poi_id=poi.id,
            name=f"{name}",
            description="Dữ liệu mẫu kiểm tra trạng thái và phân tách POI.",
            price=35000,
            is_active=approved,
            is_available=available,
        ))
    return {
        "poi_category": [category.to_dump()],
        "poi": [poi.to_dump() for poi in pois],
        "menu_item": [item.to_dump() for item in items],
    }


async def init_menu_items(db: AsyncDatabase) -> None:
    for collection, documents in build_fixtures().items():
        inserted = 0
        for document in documents:
            result = await db[collection].update_one(
                {"_id": document["_id"]},
                {"$setOnInsert": document},
                upsert=True,
            )
            inserted += result.upserted_id is not None
        print(f"{collection}: inserted {inserted}, kept {len(documents) - inserted}")
    for poi_number in (10, 11):
        poi_id = fixture_id(poi_number)
        pending = await db["menu_item"].count_documents(
            {"poi_id": poi_id, "deleted_at": None, "is_active": False}
        )
        print(f"POI {poi_id}: {pending} pending menu items")
