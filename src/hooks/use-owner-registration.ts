import { useContext } from "react"

import { PoiOwnerContext } from "../contexts/poi-owner"

export function useOwnerRegistration() {
  const context = useContext(PoiOwnerContext)

  if (!context) {
    throw new Error("useOwnerRegistration phải được sử dụng bên trong PoiOwnerProvider.")
  }

  return context
}
