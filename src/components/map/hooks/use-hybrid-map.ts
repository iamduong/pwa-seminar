import {
  addProtocol,
  Map,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl"
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import { Protocol } from "pmtiles"
import { useEffect, useRef, useState, type RefObject } from "react"

import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../map-config"
import type { MapCoordinates, MapMode } from "../types"
import {
  canUseCloudMap,
  createOfflineStyle,
  ONLINE_STYLE,
} from "../lib/map-style"

setWorkerUrl(mapWorkerUrl)

let isPmtilesProtocolRegistered = false

function ensurePmtilesProtocol() {
  if (isPmtilesProtocolRegistered) return

  const protocol = new Protocol()
  addProtocol("pmtiles", protocol.tile)
  isPmtilesProtocolRegistered = true
}

interface UseHybridMapOptions {
  containerRef: RefObject<HTMLDivElement | null>
  initialCenter?: MapCoordinates
  initialZoom?: number
}

export function useHybridMap({
  containerRef,
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
}: UseHybridMapOptions) {
  const mapRef = useRef<Map | null>(null)
  const initialCenterRef = useRef(initialCenter)
  const initialZoomRef = useRef(initialZoom)
  const [map, setMap] = useState<Map | null>(null)
  const [mode, setMode] = useState<MapMode>("checking")

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    ensurePmtilesProtocol()

    let disposed = false
    let connectionCheckId = 0
    let currentMode: Exclude<MapMode, "checking"> | null = null

    const showMap = (nextMode: Exclude<MapMode, "checking">) => {
      if (disposed || currentMode === nextMode) return

      const style: StyleSpecification | string =
        nextMode === "online" ? ONLINE_STYLE : createOfflineStyle()

      if (mapRef.current) {
        mapRef.current.setStyle(style)
      } else {
        const nextMap = new Map({
          container,
          center: initialCenterRef.current,
          zoom: initialZoomRef.current,
          fadeDuration: 0,
          style,
        })

        mapRef.current = nextMap
        setMap(nextMap)
      }

      currentMode = nextMode
      setMode(nextMode)
    }

    const checkConnection = async () => {
      const checkId = ++connectionCheckId

      if (!navigator.onLine) {
        showMap("offline")
        return
      }

      const cloudWorks = await canUseCloudMap()
      if (disposed || checkId !== connectionCheckId) return
      showMap(cloudWorks ? "online" : "offline")
    }

    const handleOffline = () => {
      connectionCheckId += 1
      showMap("offline")
    }
    const handleOnline = () => void checkConnection()

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    void checkConnection()

    return () => {
      disposed = true
      connectionCheckId += 1
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      mapRef.current?.remove()
      mapRef.current = null
      setMap(null)
    }
  }, [containerRef])

  return { map, mode }
}
