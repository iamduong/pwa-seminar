import type { FeatureCollection, Point } from "geojson"
import {
  type CircleLayerSpecification,
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
} from "maplibre-gl"
import { useEffect, useMemo } from "react"

import { POI_CATEGORY_GROUPS, POI_GROUP_STYLES } from "../map-config"
import type { MapPoi } from "../types"

const SOURCE_ID = "pois"
const CIRCLE_LAYER_ID = "poi-circles"
const SELECTED_LAYER_ID = "selected-poi"

interface PoiProperties {
  id: string
  name: string
  address: string
  categoryCode: string
}

type CircleColor = NonNullable<CircleLayerSpecification["paint"]>["circle-color"]

function getPoiColorExpression(): CircleColor {
  return [
    "match",
    ["get", "categoryCode"],
    [...POI_CATEGORY_GROUPS.food],
    POI_GROUP_STYLES.food.color,
    [...POI_CATEGORY_GROUPS.drink],
    POI_GROUP_STYLES.drink.color,
    [...POI_CATEGORY_GROUPS.snack],
    POI_GROUP_STYLES.snack.color,
    [...POI_CATEGORY_GROUPS.specialty],
    POI_GROUP_STYLES.specialty.color,
    "#64748b",
  ]
}

export function usePoiLayer(
  map: MapLibreMap | null,
  pois: MapPoi[],
  selectedPoiId?: string | null,
  onPoiSelect?: (poi: MapPoi) => void,
) {
  const poiById = useMemo(
    () => new Map(pois.map((poi) => [poi.id, poi])),
    [pois],
  )

  const data = useMemo<FeatureCollection<Point, PoiProperties>>(
    () => ({
      type: "FeatureCollection",
      features: pois.map((poi) => ({
        type: "Feature",
        id: poi.id,
        geometry: { type: "Point", coordinates: poi.coordinates },
        properties: {
          id: poi.id,
          name: poi.name,
          address: poi.address ?? "",
          categoryCode: poi.categoryCode,
        },
      })),
    }),
    [pois],
  )

  useEffect(() => {
    if (!map) return

    const addOrUpdateLayer = () => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined

      if (source) {
        source.setData(data)
      } else {
        map.addSource(SOURCE_ID, { type: "geojson", data })
      }

      if (!map.getLayer(CIRCLE_LAYER_ID)) {
        map.addLayer({
          id: CIRCLE_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-color": getPoiColorExpression(),
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 16, 10],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        })
      }

      if (!map.getLayer(SELECTED_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "id"], selectedPoiId ?? ""],
          paint: {
            "circle-color": "transparent",
            "circle-radius": 15,
            "circle-stroke-color": "#111827",
            "circle-stroke-width": 3,
          },
        })
      } else {
        map.setFilter(SELECTED_LAYER_ID, [
          "==",
          ["get", "id"],
          selectedPoiId ?? "",
        ])
      }
    }

    const handleClick = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id
      if (typeof id !== "string") return

      const poi = poiById.get(id)
      if (poi) onPoiSelect?.(poi)
    }
    const showPointer = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const hidePointer = () => {
      map.getCanvas().style.cursor = ""
    }

    if (map.isStyleLoaded()) addOrUpdateLayer()
    map.on("style.load", addOrUpdateLayer)
    map.on("click", CIRCLE_LAYER_ID, handleClick)
    map.on("mouseenter", CIRCLE_LAYER_ID, showPointer)
    map.on("mouseleave", CIRCLE_LAYER_ID, hidePointer)

    return () => {
      map.off("style.load", addOrUpdateLayer)
      map.off("click", CIRCLE_LAYER_ID, handleClick)
      map.off("mouseenter", CIRCLE_LAYER_ID, showPointer)
      map.off("mouseleave", CIRCLE_LAYER_ID, hidePointer)
    }
  }, [data, map, onPoiSelect, poiById, selectedPoiId])
}
