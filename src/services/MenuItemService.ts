import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type {
  MenuItemSubmission,
  MenuItemSubmissionPayload,
  OwnerPoiOption,
} from "../types/MenuItem";

class MenuItemService {
  async listMyPois() {
    const response = await api.get<ApiResponse<OwnerPoiOption[]>>(
      "/menu-items/my-pois",
    );
    return response.data;
  }

  async listMine() {
    const response = await api.get<ApiResponse<MenuItemSubmission[]>>(
      "/menu-items/mine",
    );
    return response.data;
  }

  async submit(payload: MenuItemSubmissionPayload) {
    const response = await api.post<ApiResponse<MenuItemSubmission>>(
      "/menu-items/requests",
      payload,
    );
    return response.data;
  }
}

export const menuItemService = new MenuItemService();
