import { useEffect, useRef } from "react"

import { cn } from "#lib/utils"

import "maplibre-gl/dist/maplibre-gl.css"

import { useGeolocationControl } from "./hooks/use-geolocation-control"
import { useHybridMap } from "./hooks/use-hybrid-map"
import { usePoiLayer } from "./layers/use-poi-layer"
import { useSelectedLocationLayer } from "./layers/use-selected-location-layer"
import { MapLegend } from "./MapLegend"
import type { HybridMapProps } from "./types"

const MODE_LABELS = {
  checking: "Đang kiểm tra bản đồ…",
  online: "Bản đồ trực tuyến",
  offline: "Bản đồ ngoại tuyến",
} as const

export default function HybridMap({
  className,
  initialCenter,
  initialZoom,
  pois = [],
  selectedPoiId,
  selectedLocation,
  showGeolocation = true,
  showLegend = true,
  onMapReady,
  onLocationSelect,
  onPoiSelect,
}: HybridMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onMapReadyRef = useRef(onMapReady)
  const { map, mode } = useHybridMap({
    containerRef,
    initialCenter,
    initialZoom,
  })

  useGeolocationControl(map, showGeolocation)
  usePoiLayer(map, pois, selectedPoiId, onPoiSelect)
  useSelectedLocationLayer(map, selectedLocation, onLocationSelect)

  useEffect(() => {
    onMapReadyRef.current = onMapReady
  }, [onMapReady])

  useEffect(() => {
    if (map) onMapReadyRef.current?.(map)
  }, [map])

  return (
    <section
      className={cn(
        "relative h-128 min-h-80 w-full overflow-hidden rounded-xl border bg-muted",
        className,
      )}
      aria-label="Bản đồ địa điểm"
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {onLocationSelect && (
        <div className="pointer-events-none absolute top-14 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
          Nhấn lên bản đồ để chọn vị trí
        </div>
      )}

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

      {showLegend && <MapLegend />}
    </section>
  )
}
