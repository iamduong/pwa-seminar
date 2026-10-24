import type { Pagination } from "./contract/Pagination";

export type PoiCategory = {
    id: string;
    name: string;
}

export type PoiCategoryPagination = Pagination<PoiCategory>;