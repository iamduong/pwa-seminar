import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type {
  AdminPoi,
  MenuItem,
  MenuItemCreatePayload,
  MenuItemPayload,
  OwnerPoiOption,
} from "../types/MenuItem";
import type { Pagination } from "../types/contract/Pagination";

class MenuItemService {
  async listMyPois() {
    const response = await api.get<ApiResponse<OwnerPoiOption[]>>("/menu-items/my-pois");
    return response.data;
  }

  async listMine() {
    const response = await api.get<ApiResponse<MenuItem[]>>("/menu-items/mine");
    return response.data;
  }

  async get(id: string) {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu-items/${id}`);
    return response.data;
  }

  async submit(payload: MenuItemPayload) {
    const response = await api.post<ApiResponse<MenuItem>>("/menu-items", payload);
    return response.data;
  }

  async update(id: string, payload: MenuItemPayload) {
    const response = await api.put<ApiResponse<MenuItem>>(`/menu-items/${id}`, payload);
    return response.data;
  }

  async listPois(page = 1) {
    const response = await api.get<ApiResponse<Pagination<AdminPoi>>>("/pois", {
      params: { page, page_size: 20 },
    });
    return response.data;
  }

  async getPoi(poiId: string) {
    const response = await api.get<ApiResponse<AdminPoi>>(`/pois/${poiId}/summary`);
    return response.data;
  }

  async listByPoi(poiId: string, page = 1, isActive?: boolean) {
    const response = await api.get<ApiResponse<Pagination<MenuItem>>>(
      `/pois/${poiId}/menu-items`,
      { params: { page, page_size: 20, is_active: isActive } },
    );
    return response.data;
  }

  async createDirect(poiId: string, payload: MenuItemCreatePayload) {
    const response = await api.post<ApiResponse<MenuItem>>(
      `/pois/${poiId}/menu-items`,
      payload,
    );
    return response.data;
  }

  async approveItem(poiId: string, itemId: string) {
    const response = await api.post<ApiResponse<MenuItem>>(
      `/menu-items/by-poi/${poiId}/${itemId}/approve`,
    );
    return response.data;
  }
}

export const menuItemService = new MenuItemService();
