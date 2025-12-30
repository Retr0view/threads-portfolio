"use client"

import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Hook to observe element size changes using ResizeObserver
 * Provides width and height of the observed element
 * 
 * @param debounceMs - Optional debounce delay in milliseconds (default: 150)
 * @returns Object containing:
 *   - ref: Ref to attach to the element to observe
 *   - width: Current width of the element
 *   - height: Current height of the element
 * 
 * @example
 * const { ref, width, height } = useResizeObserver()
 * 
 * return <div ref={ref}>Width: {width}px</div>
 */
export function useResizeObserver(debounceMs: number = 150) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const ref = useRef<HTMLElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateDimensions = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setDimensions({
          width: element.offsetWidth,
          height: element.offsetHeight,
        })
      }, debounceMs)
    }

    // Initial measurement
    updateDimensions()

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [debounceMs])

  return { ref, ...dimensions }
}



