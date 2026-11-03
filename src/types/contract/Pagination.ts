export type Pagination<T> = {
    page: number;
    page_size: number;
    total_item: number;
    total_page: number;
    data: T[];
}
