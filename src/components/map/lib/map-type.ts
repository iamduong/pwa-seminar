export type MapMode = "checking" | "online" | "offline"

export type MapCoordinates = [longitude: number, latitude: number]

export interface MapPoi {
  id: string
  name: string
  coordinates: MapCoordinates
  address?: string
}

export interface HybridMapProps {
  className?: string;
  initialCenter?: MapCoordinates;
  initialZoom?: number;

  pois?: MapPoi[];

  showGeolocation?: boolean;

  selectedLocation?: MapCoordinates | null;
  selectedRadius?: number | null;
  focusSelectedLocation?: boolean;
  selectedLocationZoom?: number;
  
  onLocationSelect?: (coordinates: MapCoordinates) => void;
  onPoiSelect?: (poi: MapPoi) => void;
}
