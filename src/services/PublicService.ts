import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type { PoiBundle } from "../types/Poi";
import type { PoiCategoryPagination } from "../types/PoiCategory";
import type { UiBundle } from "../types/UiBundle";
import type { MenuItemBundle } from "../types/MenuItem";

class PublicService {
    async RecordPoiAudioListen(poiId: string) {
        const response = await api.post<ApiResponse<{
            poi_id: string;
            audio_listen_count: number;
        }>>(`/public/pois/${poiId}/audio-listens`);

        return response.data;
    }

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

    async BundleMenuItem(
        lang: string,
        etag?: string,
        signal?: AbortSignal,
    ): Promise<ApiResponse<MenuItemBundle> | null> {
        const response = await api.get<ApiResponse<MenuItemBundle>>(
            "/public/menu-item/load-all",
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
