import { useEffect, useRef, useState } from "react";
import {
  GeolocateControl,
  Map,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";

import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

import { cn } from "#lib/utils";

import "maplibre-gl/dist/maplibre-gl.css";

import { createOfflineStyle, ONLINE_STYLE } from "./lib/map-style";
import type { HybridMapProps, MapCoordinates, MapMode } from "./lib/map-type";
import { ensurePmtilesProtocol } from "./lib/pmtiles-protocol";
import { drawClientLocation } from "./util/clientLocation";
import { drawPoiMarkers } from "./util/poiMarkers";
import { drawSelectedLocation } from "./util/selectedLocation";

setWorkerUrl(mapWorkerUrl);

const DEFAULT_MAP_CENTER: MapCoordinates = [106.704, 10.76];
const DEFAULT_MAP_ZOOM = 15;

const MODE_LABELS = {
  checking: "Đang kiểm tra bản đồ…",
  online: "Bản đồ trực tuyến",
  offline: "Bản đồ ngoại tuyến",
} as const;

const HybridMap = ({
  className,

  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  isSupportLocation = false,

  selectedLocation,
  // action when click to map
  onClickMap,
  onClickPoiMarker,

  // Poi markers
  poiMarkers = [],

  // Client location
  clientLocation,
}: HybridMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);
  const isSupportLocationRef = useRef(isSupportLocation);

  // ! Action when click to map
  const onClickMapRef = useRef(onClickMap);
  const onClickPoiMarkerRef = useRef(onClickPoiMarker);

  // ! Mode checking state
  const [mode, setMode] = useState<MapMode>("checking");
  useEffect(() => {
    onClickMapRef.current = onClickMap;
  }, [onClickMap]);

  useEffect(() => {
    onClickPoiMarkerRef.current = onClickPoiMarker;
  }, [onClickPoiMarker]);

  // * Only run once
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

    // ! Button click to go to self locationm (GPS)
    if (isSupportLocationRef.current) {
      const geolocateControl = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserLocation: true,
      });

      map.addControl(geolocateControl, "top-right");
    }

    // ! Clickable to active action
    if (onClickMapRef.current) {
      map.getCanvas().style.cursor = "crosshair";
    }
    map.on("click", (event) => {
      onClickMapRef.current?.([event.lngLat.lng, event.lngLat.lat]);
    });

    setMode(nextMode);

    // ! online/offline listener
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
  }, []);

  // * Client location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !clientLocation) return;
  
    drawClientLocation(map, clientLocation);
  
  }, [clientLocation]);

  // * Poi marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = drawPoiMarkers(map, poiMarkers, (poiMarker) => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      map.easeTo({
        center: poiMarker.location.coordinates,
        offset: [0, -100],
        duration: reduceMotion ? 0 : 500,
      });
      onClickPoiMarkerRef.current?.(poiMarker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [poiMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      drawSelectedLocation(map, selectedLocation);
    }
    
    map.on("style.load", () => drawSelectedLocation(map, selectedLocation));

    return () => {
      map.off("style.load", () => drawSelectedLocation(map, selectedLocation));
    };
  }, [selectedLocation]);

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
      {onClickMap && (
        <div className="pointer-events-none absolute top-14 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
          Nhấn lên bản đồ để chọn vị trí
        </div>
      )}
    </section>
  );
};

export default HybridMap;
