import { GeolocateControl, type Map } from "maplibre-gl"
import { useEffect } from "react"

export function useGeolocationControl(map: Map | null, enabled: boolean) {
  useEffect(() => {
    if (!map || !enabled) return

    const control = new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })

    map.addControl(control, "top-right")
    return () => {
      map.removeControl(control)
    }
  }, [enabled, map])
}
