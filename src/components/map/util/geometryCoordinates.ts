import type { GeoJSONSource, Map } from "maplibre-gl";
import type { MapCoordinates } from "../lib/map-type";

export const drawGeometryCoordinates = (
  map: Map,
  geometryCoordinates?: MapCoordinates[],
) => {
  const sourceId = "route";
  const layerId = "route";
  const existingSource = map.getSource(sourceId);

  if (!geometryCoordinates?.length) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (existingSource) map.removeSource(sourceId);
    return;
  }

  const validCoordinates = geometryCoordinates.filter(
    ([longitude, latitude]) =>
      Number.isFinite(longitude) &&
      Number.isFinite(latitude) &&
      longitude >= -180 && longitude <= 180 &&
      latitude >= -90 && latitude <= 90,
  );
  if (validCoordinates.length < 2) return;

  const data = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: validCoordinates,
    },
  };

  if (existingSource?.type === "geojson") {
    (existingSource as GeoJSONSource).setData(data);
  } else {
    map.addSource("route", {
      type: "geojson",
      data,
    });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#2391FF",
        "line-width": 5,
      },
    });
  }

  const longitudes = validCoordinates.map(([longitude]) => longitude);
  const latitudes = validCoordinates.map(([, latitude]) => latitude);
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
    { padding: 48, maxZoom: 16, duration: 500 },
  );
};
