export type MenuItemSubmissionStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected";

export type OwnerPoiOption = {
  id: string;
  name: string;
};

export type MenuItemSubmission = {
  id: string;
  owner_id: string;
  poi_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  status: MenuItemSubmissionStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type MenuItemSubmissionPayload = {
  poi_id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
};

export type MenuItemPayload = {
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
};

export type MenuItem = MenuItemPayload & {
  id: string;
  poi_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminPoi = {
  id: string;
  name: string;
  address: string;
};