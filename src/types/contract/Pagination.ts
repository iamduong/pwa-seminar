export type Pagination<T> = {
    items: T[];
    page: number;
    page_size: number;
    item_count: number;
    total_items: number;
    total_pages: number;
}