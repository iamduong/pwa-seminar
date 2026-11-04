import api from "#lib/api";
import type { ApiResponse } from "#lib/api";

import type {
    AdminUserPagination,
    FilterAdminUser,
} from "../types/AdminUser";

class AdminUserService {
    async PaginationAdminUser(
        params: FilterAdminUser,
        signal?: AbortSignal,
    ) {
        const response = await api.get<
            ApiResponse<AdminUserPagination>
        >("/admin-users", {
            params: {
                ...params,
                q: params.q?.trim() || undefined,
            },
            signal,
        });

        return response.data;
    }
}

export const adminUserService = new AdminUserService();
