import type { PublicPoi } from "../../../types/Poi";

export type MapMode = "checking" | "online" | "offline";

export type MapCoordinates = [longitude: number, latitude: number];

export type SelectedLocation = {
  location?: MapCoordinates;
  radius?: number;
  isFocus?: boolean;
  zoom?: number;
};

export type PoiMarker = PublicPoi;
export interface HybridMapProps {
  className?: string;

  initialCenter?: MapCoordinates;
  initialZoom?: number;
  isSupportLocation?: boolean;

  poiMarkers?: PoiMarker[];
  clientLocation?: MapCoordinates;
  geometryCoordinates?: MapCoordinates[];

  // Used in managed role
  selectedLocation?: SelectedLocation;

  onClickMap?: (coordinates: MapCoordinates) => void;
  onClickPoiMarker?: (poiMarker: PoiMarker) => void;
}
