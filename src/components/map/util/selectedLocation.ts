import type { FeatureCollection, Point, Polygon } from "geojson";
import type { GeoJSONSource, Map } from "maplibre-gl";

import type { MapCoordinates, SelectedLocation } from "../lib/map-type";

const SOURCE_ID = "selected-location";
const RADIUS_FILL_LAYER_ID = "selected-radius-fill";
const RADIUS_LINE_LAYER_ID = "selected-radius-line";
const LOCATION_LAYER_ID = "selected-location-point";
const DEFAULT_ZOOM = 17;

function createCircleCoordinates(
  [longitude, latitude]: MapCoordinates,
  radius: number,
) {
  const points = 64;
  const latitudeRadius = radius / 111_320;
  const longitudeRadius = radius / (111_320 * Math.cos((latitude * Math.PI) / 180));

  return Array.from({ length: points + 1 }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    return [
      longitude + longitudeRadius * Math.cos(angle),
      latitude + latitudeRadius * Math.sin(angle),
    ];
  });
}

export function drawSelectedLocation(
  map: Map,
  selectedLocation?: SelectedLocation,
) {
  const { location, radius, isFocus = false, zoom = DEFAULT_ZOOM } =
    selectedLocation ?? {};
  const features: FeatureCollection<Point | Polygon>["features"] = [];

  if (location && radius && radius > 0) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [createCircleCoordinates(location, radius)],
      },
    });
  }
  if (location) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: location },
    });
  }

  const data: FeatureCollection<Point | Polygon> = {
    type: "FeatureCollection",
    features,
  };
  const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

  if (source) {
    source.setData(data);
  } else {
    map.addSource(SOURCE_ID, { type: "geojson", data });
  }

  if (!map.getLayer(RADIUS_FILL_LAYER_ID)) {
    map.addLayer({
      id: RADIUS_FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": "#16a34a", "fill-opacity": 0.2 },
    });
  }
  if (!map.getLayer(RADIUS_LINE_LAYER_ID)) {
    map.addLayer({
      id: RADIUS_LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "line-color": "#16a34a", "line-width": 2 },
    });
  }
  if (!map.getLayer(LOCATION_LAYER_ID)) {
    map.addLayer({
      id: LOCATION_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-color": "#16a34a",
        "circle-radius": 7,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
      },
    });
  }

  if (location && isFocus) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map.easeTo({
      center: location,
      zoom,
      duration: reduceMotion ? 0 : 700,
    });
  }
}
