import { useContext } from "react"

import { AuthorizeContext } from "../providers/contexts/authorize-context"

export function useAuthorize() {
  const context = useContext(AuthorizeContext)

  if (!context) {
    throw new Error("useAuthorize must be used within an AuthorizeProvider")
  }

  return context
}
