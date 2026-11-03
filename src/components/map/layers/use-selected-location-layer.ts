import type { Feature, Point } from "geojson"
import { type GeoJSONSource, type Map } from "maplibre-gl"
import { useEffect, useMemo } from "react"

import type { MapCoordinates } from "../types"

const SOURCE_ID = "selected-location"
const LAYER_ID = "selected-location-marker"

export function useSelectedLocationLayer(
  map: Map | null,
  coordinates?: MapCoordinates | null,
  onSelect?: (coordinates: MapCoordinates) => void,
) {
  const data = useMemo<Feature<Point>>(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: coordinates ?? [0, 0],
      },
    }),
    [coordinates],
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

      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          layout: { visibility: coordinates ? "visible" : "none" },
          paint: {
            "circle-color": "#16a34a",
            "circle-radius": 9,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
          },
        })
      } else {
        map.setLayoutProperty(
          LAYER_ID,
          "visibility",
          coordinates ? "visible" : "none",
        )
      }
    }

    const handleClick = (event: { lngLat: { lng: number; lat: number } }) => {
      onSelect?.([event.lngLat.lng, event.lngLat.lat])
    }
    const showCrosshair = () => {
      if (onSelect) map.getCanvas().style.cursor = "crosshair"
    }

    if (map.isStyleLoaded()) addOrUpdateLayer()
    map.on("style.load", addOrUpdateLayer)
    if (onSelect) {
      map.on("click", handleClick)
      map.on("mousemove", showCrosshair)
    }

    return () => {
      map.off("style.load", addOrUpdateLayer)
      if (onSelect) {
        map.off("click", handleClick)
        map.off("mousemove", showCrosshair)
        map.getCanvas().style.cursor = ""
      }
    }
  }, [coordinates, data, map, onSelect])
}
