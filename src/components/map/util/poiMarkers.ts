import { Marker, type Map } from "maplibre-gl";

import type { PoiMarker } from "../lib/map-type";
import { radiusMarker } from "./radiusMarker";

const TWEMOJI_BASE_URL =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg";

const categoriesDictionary: Record<string, string> = {
  default: `${TWEMOJI_BASE_URL}/1f4cd.svg`,
  // Ẩm thực đường phố
  "6aea88d28619345b689272c0": `${TWEMOJI_BASE_URL}/1f32d.svg`,
  // Nhà hàng
  "6aea88d28619345b689272c1": `${TWEMOJI_BASE_URL}/1f374.svg`,
  // Quán ăn địa phương
  "6aea88d28619345b689272c2": `${TWEMOJI_BASE_URL}/1f372.svg`,
  // Cà phê
  "6aea88d28619345b689272c3": `${TWEMOJI_BASE_URL}/2615.svg`,
  // Đồ uống
  "6aea88d28619345b689272c4": `${TWEMOJI_BASE_URL}/1f379.svg`,
  // Tráng miệng và ăn vặt
  "6aea88d28619345b689272c5": `${TWEMOJI_BASE_URL}/1f370.svg`,
  // Tiệm bánh
  "6aea88d28619345b689272c6": `${TWEMOJI_BASE_URL}/1f35e.svg`,
  // Chợ và khu ẩm thực
  "6aea88d28619345b689272c7": `${TWEMOJI_BASE_URL}/1f6cd.svg`,
  // Đặc sản địa phương
  "6aea88d28619345b689272c8": `${TWEMOJI_BASE_URL}/1f371.svg`,
};

function createMarkerElement(
  categoryId: string,
  ariaLabel: string,
  onClick?: () => void,
) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "48px";
  wrapper.style.height = "56px";
  wrapper.style.cursor = "pointer";
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("aria-label", ariaLabel);
  wrapper.tabIndex = 0;
  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick?.();
  });
  wrapper.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onClick?.();
  });

  const pin = document.createElement("div");
  pin.style.position = "absolute";
  pin.style.top = "4px";
  pin.style.left = "2px";
  pin.style.display = "flex";
  pin.style.width = "44px";
  pin.style.height = "44px";
  pin.style.alignItems = "center";
  pin.style.justifyContent = "center";
  pin.style.border = "3px solid white";
  pin.style.borderRadius = "50% 50% 50% 0";
  pin.style.backgroundColor = "#facc15";
  pin.style.boxShadow = "0 3px 8px rgb(0 0 0 / 25%)";
  pin.style.transform = "rotate(-45deg)";

  const icon = document.createElement("img");
  icon.src = categoriesDictionary[categoryId] ?? categoriesDictionary.default;
  icon.alt = "";
  icon.style.width = "28px";
  icon.style.height = "28px";
  icon.style.borderRadius = "50%";
  icon.style.backgroundColor = "white";
  icon.style.objectFit = "contain";
  icon.style.padding = "3px";
  icon.style.transform = "rotate(45deg)";
  icon.onerror = () => {
    icon.onerror = null;
    icon.src = categoriesDictionary.default;
  };

  pin.appendChild(icon);
  wrapper.appendChild(pin);
  return wrapper;
}

export function drawPoiMarkers(
  map: Map,
  poiMarkers: PoiMarker[],
  onClickPoiMarker?: (poiMarker: PoiMarker) => void,
  markerAriaLabel = "Xem địa điểm",
): Marker[] {
  return poiMarkers.flatMap((poiMarker) => {
    const markers: Marker[] = [];

    if (poiMarker.trigger_radius > 0) {
      markers.push(
        radiusMarker(
          map,
          poiMarker.location.coordinates,
          poiMarker.trigger_radius,
        ),
      );
    }

    markers.push(
      new Marker({
        element: createMarkerElement(
          poiMarker.category_id,
          markerAriaLabel,
          () => onClickPoiMarker?.(poiMarker),
        ),
        anchor: "bottom",
      })
        .setLngLat(poiMarker.location.coordinates)
        .addTo(map),
    );

    return markers;
  });
}
