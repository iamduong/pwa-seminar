import type { Pagination } from "./contract/Pagination";

// View
export type PoiCategory = {
    id: string;
    name: string;
}

export type PoiCategoryPagination = Pagination<PoiCategory>;