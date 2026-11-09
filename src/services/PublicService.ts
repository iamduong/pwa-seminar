import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type { PoiBundle } from "../types/Poi";
import type { PoiCategoryPagination } from "../types/PoiCategory";
import type { UiBundle } from "../types/UiBundle";

class PublicService {
    async GetPoiCategory(
        q: string = "",
        page: number = 1,
        pageSize: number = 20,
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

    async BundlePoi(
        lang: string,
        updatedAfter: string | null,
        etag?: string,
        signal?: AbortSignal,
    ): Promise<ApiResponse<PoiBundle> | null> {
        const response = await api.get<ApiResponse<PoiBundle>>(
            "/public/poi/load-all",
            {
                params: {
                    lang,
                    ...(updatedAfter ? { updated_after: updatedAfter } : {}),
                },
                headers: etag ? { Etag: etag } : undefined,
                signal,
                validateStatus: (status) =>
                    (status >= 200 && status < 300) || status === 304,
            },
        );

        return response.status === 304 ? null : response.data;
    }

    async BundleUi(
        lang: string,
        etag?: string,
        signal?: AbortSignal,
    ): Promise<ApiResponse<UiBundle> | null> {
        const response = await api.get<ApiResponse<UiBundle>>(
            "/public/ui/load-all",
            {
                params: { lang },
                headers: etag ? { Etag: etag } : undefined,
                signal,
                validateStatus: (status) =>
                    (status >= 200 && status < 300) || status === 304,
            },
        );

        return response.status === 304 ? null : response.data;
    }
}

export const publicService = new PublicService();
