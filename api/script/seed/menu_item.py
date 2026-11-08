from uuid import UUID

from model.admin_user_model import AdminUserModel
from model.menu_item_model import MenuItemModel
from model.poi_category_model import PoiCategoryModel
from model.poi_model import PoiModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

POI_IDS = [UUID("7e57ca11-0000-4000-8000-000000000010"), UUID("7e57ca11-0000-4000-8000-000000000011")]


async def init_menu_items(session: AsyncSession, category: PoiCategoryModel, owner: AdminUserModel) -> None:
    poi_data = [
        (POI_IDS[0], "Phở 24h", "206 Nguyễn Trãi, Quận 1, TP.HCM", 106.6959, 10.7669),
        (POI_IDS[1], "Cơm tấm 67", "99 Võ Văn Tần, Quận 3, TP.HCM", 106.6908, 10.7792),
    ]
    pois = []
    for poi_id, name, address, longitude, latitude in poi_data:
        poi = await session.get(PoiModel, poi_id)
        if poi is None:
            poi = PoiModel(
                id=poi_id, owner_id=owner.id, category_id=category.id,
                category_name=category.name, name=name,
                description="Địa điểm ẩm thực mẫu tại Thành phố Hồ Chí Minh.",
                address=address, location={"type": "Point", "coordinates": [longitude, latitude]},
                images=[], trigger_radius=30, is_active=True,
                activation_requested=False, audio_priority=100, audio_status="pending",
            )
            session.add(poi)
        pois.append(poi)
    await session.flush()

    fixtures = [
        (pois[0], "Phở bò đặc biệt", 65000, True, True),
        (pois[0], "Phở gà", 55000, True, True),
        (pois[0], "Trà đá", 5000, False, True),
        (pois[1], "Cơm sườn bì chả", 55000, True, True),
        (pois[1], "Cơm gà", 50000, True, False),
    ]
    for poi, name, price, active, available in fixtures:
        item = (await session.scalars(select(MenuItemModel).where(MenuItemModel.poi_id == poi.id, MenuItemModel.name == name))).first()
        if item is None:
            session.add(MenuItemModel(
                poi_id=poi.id, name=name, description="Món ăn mẫu",
                price=price, is_active=active, is_available=available,
            ))
    await session.flush()
    print(f"pois: {len(pois)}, menu_items: {len(fixtures)} fixtures ready")
