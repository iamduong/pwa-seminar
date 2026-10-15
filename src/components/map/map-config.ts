import type { MapCoordinates } from "./types"

export const DEFAULT_MAP_CENTER: MapCoordinates = [106.704, 10.76]
export const DEFAULT_MAP_ZOOM = 12

export const POI_CATEGORY_GROUPS = {
  food: ["street-food", "restaurant", "local-eatery", "food-market"],
  drink: ["cafe", "beverage"],
  snack: ["dessert", "bakery"],
  specialty: ["specialty"],
} as const

export const POI_GROUP_STYLES = {
  food: { label: "Đồ ăn", color: "#ef4444" },
  drink: { label: "Đồ uống", color: "#3b82f6" },
  snack: { label: "Bánh & ăn vặt", color: "#f59e0b" },
  specialty: { label: "Đặc sản", color: "#8b5cf6" },
} as const
