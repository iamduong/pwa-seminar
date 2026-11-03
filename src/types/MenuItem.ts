export type MenuItemSubmissionStatus = "pending" | "approved" | "rejected";

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
