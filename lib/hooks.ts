import { useState, useEffect, useCallback } from "react"

/**
 * Debounce hook for delaying function execution
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(callback)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [callback, delay])

  return debouncedCallback as T
}

/**
 * Hook to check if viewport is desktop size (>= 1024px)
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    // Check immediately
    checkDesktop()

    // Debounce resize handler to avoid excessive updates
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkDesktop, 150)
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return isDesktop
}

/**
 * Hook to check if viewport matches a breakpoint
 */
export function useBreakpoint(breakpoint: number): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const checkBreakpoint = () => {
      setMatches(window.innerWidth >= breakpoint)
    }

    // Check immediately
    checkBreakpoint()

    // Debounce resize handler
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkBreakpoint, 150)
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [breakpoint])

  return matches
}
