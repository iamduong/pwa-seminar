import type { MapCoordinates } from "../components/map/lib/map-type";
import type { GeoPoint } from "./contract/GeoPoint";
import type { Pagination } from "./contract/Pagination";

export type PoiSubmissionStatus = "pending" | "approved" | "rejected";
export type PoiSubmissionType = "create" | "update";

export type PoiSubmission = {
  id: string;
  owner_id: string;
  poi_id: string | null;
  submission_type: PoiSubmissionType;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  address: string;
  location: GeoPoint;
  images: string[];
  trigger_radius: number;
  owner_note: string;
  status: PoiSubmissionStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export type PoiSubmissionPagination = Pagination<PoiSubmission>;

export type RegisterPoiSubmissionPayload = {
  category_id: string;
  name: string;
  description: string;
  address: string;
  location: {
    type: "Point";
    coordinates: MapCoordinates;
  };
  images: string[];
  trigger_radius: number;
  owner_note: string;
}

export type ReviewPoiSubmissionPayload = {
  status: Extract<PoiSubmissionStatus, "approved" | "rejected">;
  admin_note: string;
  activation_requested: boolean;
  audio_priority: number;
};
