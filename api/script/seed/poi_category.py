from model.poi_category_model import PoiCategoryModel
from pymongo.asynchronous.database import AsyncDatabase


async def init_poi_category(db: AsyncDatabase):
    collection = db["poi_category"]

    poi_categories: list[PoiCategoryModel] = [
        PoiCategoryModel(name="Ẩm thực đường phố"),
        PoiCategoryModel(name="Nhà hàng"),
        PoiCategoryModel(name="Quán ăn địa phương"),
        PoiCategoryModel(name="Cà phê"),
        PoiCategoryModel(name="Đồ uống"),
        PoiCategoryModel(name="Tráng miệng và ăn vặt"),
        PoiCategoryModel(name="Tiệm bánh"),
        PoiCategoryModel(name="Chợ và khu ẩm thực"),
        PoiCategoryModel(name="Đặc sản địa phương"),
    ]

    documents = [
        poi_category.model_dump(by_alias=True) for poi_category in poi_categories
    ]
    result = await collection.insert_many(documents=documents)

    print(result.inserted_ids)
