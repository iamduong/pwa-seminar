import type { Pagination } from "./contract/Pagination";

export type TourPoi = {
  id: string;
  name: string;
  address: string;
};

export type Tour = {
  id: string;
  code: string;
  price: string | number;
  max_people: number;
  scanned_people: number;
  expires_at: string;
  pois: TourPoi[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TourPagination = Pagination<Tour>;

export type CreateTourPayload = {
  price: string;
  max_people: number;
  expires_at: string;
  poi_ids: string[];
};
