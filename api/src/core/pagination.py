from pydantic import BaseModel


class Pagination[T](BaseModel):
    page: int
    page_size: int
    # len data match condition
    total_item: int
    total_page: int
    # data
    data: list[T]
