import { useEffect, useRef, useState } from "react";
import {
  addProtocol,
  GeolocateControl,
  Map,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import type { FeatureCollection, Point, Polygon } from "geojson";

import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

import { Protocol } from "pmtiles";

import { cn } from "#lib/utils";

import "maplibre-gl/dist/maplibre-gl.css";

import { createOfflineStyle, ONLINE_STYLE } from "./lib/map-style";

import type { HybridMapProps, MapCoordinates, MapMode } from "./lib/map-type";

setWorkerUrl(mapWorkerUrl);

const DEFAULT_MAP_CENTER: MapCoordinates = [106.704, 10.76];
const DEFAULT_MAP_ZOOM = 15;
const SELECTED_LOCATION_SOURCE_ID = "selected-location";
const SELECTED_RADIUS_FILL_LAYER_ID = "selected-radius-fill";
const SELECTED_RADIUS_LINE_LAYER_ID = "selected-radius-line";
const SELECTED_LOCATION_LAYER_ID = "selected-location-point";

let isPmtilesProtocolRegistered = false;

const ensurePmtilesProtocol = () => {
  // Ignore when component mounts again, needn't register again
  if (isPmtilesProtocolRegistered) return;

  const protocol = new Protocol();
  addProtocol("pmtiles", protocol.tile);
  isPmtilesProtocolRegistered = true;
};

const MODE_LABELS = {
  checking: "Đang kiểm tra bản đồ…",
  online: "Bản đồ trực tuyến",
  offline: "Bản đồ ngoại tuyến",
} as const;

const createCircleCoordinates = (
  [longitude, latitude]: MapCoordinates,
  radius: number,
) => {
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
};

const createSelectedLocationData = (
  location?: MapCoordinates | null,
  radius?: number | null,
): FeatureCollection<Point | Polygon> => {
  if (!location) return { type: "FeatureCollection", features: [] };

  const features: FeatureCollection<Point | Polygon>["features"] = [];

  if (radius && radius > 0) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [createCircleCoordinates(location, radius)],
      },
    });
  }

  features.push({
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: location },
  });

  return { type: "FeatureCollection", features };
};

const HybridMap = ({
  className,

  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,

  selectedLocation,
  selectedRadius,
  focusSelectedLocation = false,
  selectedLocationZoom = 17,

  showGeolocation = true,

  onLocationSelect,
}: HybridMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);

  const onLocationSelectRef = useRef(onLocationSelect);

  const [mode, setMode] = useState<MapMode>("checking");

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextMode: Exclude<MapMode, "checking"> = navigator.onLine
      ? "online"
      : "offline";
    const style: StyleSpecification | string =
      nextMode === "online" ? ONLINE_STYLE : createOfflineStyle();

    if (nextMode === "offline") {
      ensurePmtilesProtocol();
    }

    const map = new Map({
      container,
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      fadeDuration: 0,
      style,
    });
    mapRef.current = map;

    // location
    if (showGeolocation) {
      const geolocateControl = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserLocation: true,
      });

      map.addControl(geolocateControl, "top-right");
    }

    // Clickable
    if (onLocationSelectRef.current) {
      map.getCanvas().style.cursor = "crosshair";
    }
    map.on("click", (event) => {
      onLocationSelectRef.current?.([event.lngLat.lng, event.lngLat.lat]);
    });

    setMode(nextMode);

    const handleOffline = () => {
      ensurePmtilesProtocol();
      map.setStyle(createOfflineStyle());
      setMode("offline");
    };

    const handleOnline = () => {
      map.setStyle(ONLINE_STYLE);
      setMode("online");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      map.remove();
      mapRef.current = null;
    };
  }, [showGeolocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const data = createSelectedLocationData(selectedLocation, selectedRadius);

    const updateSelectedLocation = () => {
      const source = map.getSource(SELECTED_LOCATION_SOURCE_ID) as
        | GeoJSONSource
        | undefined;

      if (source) {
        source.setData(data);
      } else {
        map.addSource(SELECTED_LOCATION_SOURCE_ID, {
          type: "geojson",
          data,
        });
      }

      if (!map.getLayer(SELECTED_RADIUS_FILL_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_RADIUS_FILL_LAYER_ID,
          type: "fill",
          source: SELECTED_LOCATION_SOURCE_ID,
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": "#16a34a",
            "fill-opacity": 0.2,
          },
        });
      }

      if (!map.getLayer(SELECTED_RADIUS_LINE_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_RADIUS_LINE_LAYER_ID,
          type: "line",
          source: SELECTED_LOCATION_SOURCE_ID,
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "line-color": "#16a34a",
            "line-width": 2,
          },
        });
      }

      if (!map.getLayer(SELECTED_LOCATION_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_LOCATION_LAYER_ID,
          type: "circle",
          source: SELECTED_LOCATION_SOURCE_ID,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-color": "#16a34a",
            "circle-radius": 7,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
          },
        });
      }
    };

    if (map.isStyleLoaded()) updateSelectedLocation();
    map.on("style.load", updateSelectedLocation);

    if (selectedLocation && focusSelectedLocation) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.easeTo({
        center: selectedLocation,
        zoom: selectedLocationZoom,
        duration: reduceMotion ? 0 : 700,
      });
    }

    return () => {
      map.off("style.load", updateSelectedLocation);
    };
  }, [focusSelectedLocation, selectedLocation, selectedLocationZoom, selectedRadius]);

  return (
    <section
      className={cn(
        "relative h-128 min-h-80 w-full overflow-hidden rounded-xl border bg-muted",
        className,
      )}
      aria-label="Bản đồ địa điểm"
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* map mode */}
      <div className="pointer-events-none absolute top-3 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
        <span
          className={cn(
            "mr-1.5 inline-block size-2 rounded-full",
            mode === "checking" && "bg-amber-500",
            mode === "online" && "bg-emerald-500",
            mode === "offline" && "bg-slate-500",
          )}
        />
        {MODE_LABELS[mode]}
      </div>

      {/* Text helper */}
      {onLocationSelect && (
        <div className="pointer-events-none absolute top-14 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
          Nhấn lên bản đồ để chọn vị trí
        </div>
      )}
    </section>
  );
};

export default HybridMap;
