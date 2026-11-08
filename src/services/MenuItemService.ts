import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type { MenuItem, MenuItemPayload, OwnerPoiOption } from "../types/MenuItem";

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
}

export const menuItemService = new MenuItemService();
