import type { Map } from "maplibre-gl"

export const POI_CATEGORY_CODES = [
  "street-food",
  "restaurant",
  "local-eatery",
  "cafe",
  "beverage",
  "dessert",
  "bakery",
  "food-market",
  "specialty",
] as const

export type PoiCategoryCode = (typeof POI_CATEGORY_CODES)[number]
export type MapMode = "checking" | "online" | "offline"
export type MapCoordinates = [longitude: number, latitude: number]

export interface MapPoi {
  id: string
  name: string
  categoryCode: PoiCategoryCode
  coordinates: MapCoordinates
  address?: string
}

export interface HybridMapProps {
  className?: string
  initialCenter?: MapCoordinates
  initialZoom?: number
  pois?: MapPoi[]
  selectedPoiId?: string | null
  showGeolocation?: boolean
  showLegend?: boolean
  selectedLocation?: MapCoordinates | null
  onMapReady?: (map: Map) => void
  onLocationSelect?: (coordinates: MapCoordinates) => void
  onPoiSelect?: (poi: MapPoi) => void
}
