export type OwnerPoiOption = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  poi_id: string;
  name: string;
  description: string | null;
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
  image_url?: string;
};

export type MenuItemCreatePayload = {
  name: string;
  description: string | null;
  image_url: string | null;
};

export type MenuTranslationStatus = "queued" | "running" | "done" | "failed";

export type MenuTranslationTask = {
  id: string;
  poi_id: string;
  name: string;
  status: MenuTranslationStatus;
  progress_percent: number;
  is_available: boolean;
  localizations: {
    id: string;
    lang: string;
    name: string;
    description: string | null;
    translation_status: "pending" | "processing" | "ready" | "failed";
    error_message: string | null;
    updated_at: string;
  }[];
};

export type AdminPoi = {
  id: string;
  name: string;
  address: string;
};
