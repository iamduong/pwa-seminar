export type OwnerPoiOption = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  poi_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItemPayload = {
  poi_id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
};
