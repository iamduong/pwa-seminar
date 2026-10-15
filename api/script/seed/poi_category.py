from model.poi_category_model import PoiCategoryModel
from pymongo.asynchronous.database import AsyncDatabase


async def init_poi_category(db: AsyncDatabase):
    collection = db["poi_category"]

    poi_categories: list[PoiCategoryModel] = [
        PoiCategoryModel(code="street-food", name="Ẩm thực đường phố"),
        PoiCategoryModel(code="restaurant", name="Nhà hàng"),
        PoiCategoryModel(code="local-eatery", name="Quán ăn địa phương"),
        PoiCategoryModel(code="cafe", name="Cà phê"),
        PoiCategoryModel(code="beverage", name="Đồ uống"),
        PoiCategoryModel(code="dessert", name="Tráng miệng và ăn vặt"),
        PoiCategoryModel(code="bakery", name="Tiệm bánh"),
        PoiCategoryModel(code="food-market", name="Chợ và khu ẩm thực"),
        PoiCategoryModel(code="specialty", name="Đặc sản địa phương"),
    ]

    documents = [
        poi_category.model_dump(by_alias=True) for poi_category in poi_categories
    ]
    result = await collection.insert_many(documents=documents)

    print(result.inserted_ids)
