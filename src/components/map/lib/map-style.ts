import { layers, namedFlavor } from "@protomaps/basemaps"
import type { FilterSpecification, StyleSpecification } from "maplibre-gl"

export const ONLINE_STYLE = "https://tiles.openfreemap.org/styles/positron"
const OFFLINE_MAP_URL = new URL("../source/quan_4.pmtiles", import.meta.url).href

export function createOfflineStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${OFFLINE_MAP_URL}`,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: layers("protomaps", namedFlavor("light"), { lang: "vi" }),
  }
}

const ROAD_SHIELD_LAYERS = new Set([
  "highway-shield-non-us", "highway-shield-us-interstate", "road_shield_us",
])

function guardReferenceLength(expression: unknown): unknown {
  if (!Array.isArray(expression)) return expression
  if (expression.length === 2 && expression[0] === "get" && expression[1] === "ref_length") {
    // Missing/non-numeric lengths must fail the <= 6 filter, not throw.
    return ["number", ["get", "ref_length"], 7]
  }
  return expression.map(guardReferenceLength)
}

export function normalizeMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      if (!ROAD_SHIELD_LAYERS.has(layer.id) || !("filter" in layer) || !layer.filter) return layer
      return { ...layer, filter: guardReferenceLength(layer.filter) as FilterSpecification }
    }),
  }
}