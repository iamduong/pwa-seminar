import api from "#lib/api";

class PoiOwnerRegistrationService {
  async RegisterPoiOwner(payload: any) {
    const response = await api.post(
      "/poi-owner-registrations/register",
      payload,
    );

    return response.data;
  }
}

export const poiOwnerRegistrationService = new PoiOwnerRegistrationService();
