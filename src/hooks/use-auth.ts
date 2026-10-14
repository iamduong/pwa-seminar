import { useContext } from "react"

import { AuthorizeContext } from "../contexts/authorize"

export function useAuth() {
  const context = useContext(AuthorizeContext)

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider.")
  }

  return context
}
