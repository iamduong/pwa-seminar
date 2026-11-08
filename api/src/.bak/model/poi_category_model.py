from schema.contract.base_contact import Base


class PoiCategoryModel(Base):
    name: str
    is_active: bool = True
