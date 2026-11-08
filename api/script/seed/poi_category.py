from model.poi_category_model import PoiCategoryModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

CATEGORY_NAMES = [
    "Ẩm thực đường phố", "Nhà hàng", "Quán ăn địa phương", "Cà phê",
    "Đồ uống", "Tráng miệng và ăn vặt", "Tiệm bánh",
    "Chợ và khu ẩm thực", "Đặc sản địa phương",
]


async def init_poi_category(session: AsyncSession) -> list[PoiCategoryModel]:
    categories = []
    for name in CATEGORY_NAMES:
        model = (await session.scalars(select(PoiCategoryModel).where(PoiCategoryModel.name == name))).first()
        if model is None:
            model = PoiCategoryModel(name=name, is_active=True)
            session.add(model)
        else:
            model.is_active, model.deleted_at = True, None
        categories.append(model)
    await session.flush()
    print(f"poi_categories: {len(categories)} fixtures ready")
    return categories
