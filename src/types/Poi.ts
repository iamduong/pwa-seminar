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
