from pydantic import BaseModel


class Pagination[T](BaseModel):
    items: list[T]
    page: int
    page_size: int
    # len items
    item_count: int
    # len items match condition
    total_items: int
    total_pages: int
