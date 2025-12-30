"use client"

import { useEffect } from "react"

/**
 * Client component to initialize theme preference
 * Prevents hydration mismatches by running theme initialization on the client
 */
export function ThemeInit() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme")
      // Force system theme - remove any stored preference that's not system
      if (stored && stored !== "system") {
        localStorage.removeItem("theme")
      } else if (!stored) {
        localStorage.setItem("theme", "system")
      }
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }, [])

  return null
}



