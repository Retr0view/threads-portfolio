"use client"

import { useEffect, createContext, useContext, useState, ReactNode } from "react"
import Lenis from "lenis"

type LenisContextType = {
  lenis: Lenis | null
}

const LenisContext = createContext<LenisContextType>({ lenis: null })

export const useLenis = () => {
  return useContext(LenisContext)
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    })

    setLenis(lenisInstance)

    let rafId: number
    let isRunning = true

    function raf(time: number) {
      if (isRunning && !document.hidden) {
        lenisInstance.raf(time)
      }
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    // Pause Lenis when page is hidden to save resources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false
        lenisInstance.stop()
      } else {
        isRunning = true
        lenisInstance.start()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      lenisInstance.destroy()
    }
  }, [])

  return (
    <LenisContext.Provider value={{ lenis }}>
      {children}
    </LenisContext.Provider>
  )
}

