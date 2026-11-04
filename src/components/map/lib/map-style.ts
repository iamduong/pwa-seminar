import { layers, namedFlavor } from "@protomaps/basemaps"
import type { StyleSpecification } from "maplibre-gl"

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
