import { useContext } from "react"

import { LocationContext } from "../providers/contexts/location-context"

export function useLocation() {
  const context = useContext(LocationContext)

  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider")
  }

  return context
}
