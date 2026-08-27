"use client"

import { useSyncExternalStore } from "react"

export function useBreakpoint(breakpoint: number): boolean {
  const query = `(min-width: ${breakpoint}px)`

  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onStoreChange)
      return () => media.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
