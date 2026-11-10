import type { MapCoordinates } from "../lib/map-type";
import { Marker, type Map } from "maplibre-gl";

export const radiusMarker = (
  map: Map,
  center: MapCoordinates,
  size: number,
): Marker => {
  const radiusInMeters = Number.isFinite(size) ? Math.max(0, size) : 0;
  const element = document.createElement("div");

  element.setAttribute("aria-hidden", "true");
  element.style.boxSizing = "border-box";
  element.style.border = "3px solid #0d8bf2";
  element.style.borderRadius = "50%";
  element.style.backgroundColor = "rgb(13 139 242 / 25%)";
  element.style.pointerEvents = "none";

  const marker = new Marker({ element, anchor: "center" })
    .setLngLat(center)
    .addTo(map);

  const updateSize = () => {
    const [longitude, latitude] = center;
    const latitudeOffset = radiusInMeters / 111_320;
    const edgeLatitude = Math.min(85.051129, latitude + latitudeOffset);
    const centerPoint = map.project([longitude, latitude]);
    const edgePoint = map.project([longitude, edgeLatitude]);
    const diameterInPixels = centerPoint.dist(edgePoint) * 2;

    element.style.width = `${diameterInPixels}px`;
    element.style.height = `${diameterInPixels}px`;
  };

  updateSize();
  map.on("zoom", updateSize);

  const removeMarker = marker.remove.bind(marker);
  marker.remove = () => {
    map.off("zoom", updateSize);
    return removeMarker();
  };

  return marker;
};