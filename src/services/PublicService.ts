import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import  type { PoiCategoryPagination } from "../types/PoiCategory";

class PublicService {
    async GetPoiCategory(
        q: string = "",
        page: number = 1,
        pageSize: number = 10,
    ) {
        const response = await api.get<ApiResponse<PoiCategoryPagination>>(
            "/public/categories",
            {
                params: {
                    q,
                    page,
                    page_size: pageSize
                }
            }
        );
        
        return response.data;
    }
}

export const publicService = new PublicService();
