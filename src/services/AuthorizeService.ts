import api from "#lib/api";
import type { ApiResponse } from "#lib/api";

import type { ChangePasswordPayload, LoginResult, LoginPayload, RegisterPayload, RegisterResult, ProfileSession } from "../types/Authorize";

class AuthorizeService {
    async Login(payload: LoginPayload) {
        const response = await api.post<ApiResponse<LoginResult>>(
            "/authorize/login", payload
        );

        return response.data;
    }

    async Register(payload: RegisterPayload) {
        const response = await api.post<ApiResponse<RegisterResult>>(
            "/authorize/register", payload
        );

        return response.data;
    }

    async Logout() {
        const response = await api.post<ApiResponse<null>>(
            "/authorize/logout"
        );

        return response.data;
    }

    async GetProfileSession() {
        const response = await api.get<ApiResponse<ProfileSession>>(
            "/authorize/about-me"
        );

        return response.data;
    }

    async RefreshSession() {

    }

    async ChangePassword(payload: ChangePasswordPayload) {
        const response = await api.post<ApiResponse<null>>(
            "/authorize/change-password", payload
        );

        return response.data;
    }
}

export const authorizeService = new AuthorizeService();
