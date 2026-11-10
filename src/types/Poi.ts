import type { Pagination } from "./contract/Pagination";
import type { GeoPoint } from "./contract/GeoPoint";

export type PoiAudioStatus = "pending" | "processing" | "ready" | "failed";

export type Poi = {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  address: string;
  location: GeoPoint;
  images: string[];
  trigger_radius: number;
  is_active: boolean;
  activation_requested: boolean;
  audio_priority: number;
  audio_status: PoiAudioStatus;
  created_at: string;
  updated_at: string;
};

export type PoiPagination = Pagination<Poi>;

export type CreateAdminPoiPayload = {
  category_id: string;
  name: string;
  description: string;
  address: string;
  location: GeoPoint;
  images: string[];
  trigger_radius: number;
  audio_priority: number;
  activation_requested: boolean;
};

export type OwnerPoiLanguage = {
  lang: string;
  category: string | null;
  name: string | null;
  description: string | null;
  translation_status: string;
  audio_status: string;
  audio_url: string | null;
  error_message: string | null;
  updated_at: string | null;
};

export type OwnerPoiTaskSummary = {
  id: string;
  type: string;
  status: string;
  progress_percent: number;
  step_language: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
};

export type OwnerPoiDetail = Poi & {
  localizations: OwnerPoiLanguage[];
  latest_task: OwnerPoiTaskSummary | null;
};

export type PublicPoi = {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  address: string;
  location: GeoPoint;
  images: string[];
  trigger_radius: number;
  audio_priority: number;
  audio_status: PoiAudioStatus;
  audio_url: string | null;
  lang: string;
  created_at: string;
  updated_at: string;
};

export type PoiBundle = {
  etag: string;
  updated_after: string | null;
  pois: PublicPoi[];
};
