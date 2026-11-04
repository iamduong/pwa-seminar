import type { Pagination } from "./contract/Pagination";

export type PoiOwnerRegistrationStatus =
  | "pending"
  | "approved"
  | "rejected";

// View
export type PoiOwnerRegistration = {
    id: string;
    user_id: string;
    business_name: string;
    business_address: string;
    note: string;
    status: PoiOwnerRegistrationStatus;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
}

// Pagination
export type PoiOwnerRegistrationPagination = Pagination<PoiOwnerRegistration>;

// Register new Poi Owner
export type RegisterPoiOwnerRegistration = {
    business_name: string;
    business_address: string;
    id_card: string;
    note: string;
}