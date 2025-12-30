import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Debounce hook for delaying function execution
 * Returns a debounced version of the callback that delays execution until after delay milliseconds
 * have elapsed since the last time it was invoked.
 * 
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the callback
 * 
 * @example
 * const debouncedSearch = useDebounce((query: string) => {
 *   console.log(query)
 * }, 300)
 * 
 * // Calling debouncedSearch multiple times quickly will only execute once after 300ms
 * debouncedSearch("a")
 * debouncedSearch("ab")
 * debouncedSearch("abc") // Only this will execute after 300ms
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Hook to check if viewport is desktop size (>= 1024px)
 * Automatically updates when window is resized (debounced to avoid excessive updates)
 * 
 * @returns {boolean} True if viewport width is >= 1024px, false otherwise
 * 
 * @example
 * const isDesktop = useIsDesktop()
 * 
 * if (isDesktop) {
 *   // Desktop-specific logic
 * }
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // Using BREAKPOINTS.DESKTOP would require importing, keeping inline for now
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
 * Automatically updates when window is resized (debounced to avoid excessive updates)
 * 
 * @param {number} breakpoint - The breakpoint width in pixels to check against
 * @returns {boolean} True if viewport width is >= breakpoint, false otherwise
 * 
 * @example
 * const isMobile = useBreakpoint(620)
 * 
 * if (isMobile) {
 *   // Mobile-specific logic
 * }
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

