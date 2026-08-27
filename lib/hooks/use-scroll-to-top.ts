"use client"

import { useLenis } from "@/components/smooth-scroll"
import { ANIMATION, EASING } from "@/lib/constants"
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

interface ActiveScrollRun {
  avatarTriggered: boolean
  bottomPadding: string
  controls: AnimationPlaybackControls | null
  element: HTMLElement
  finalized: boolean
  topPadding: string
}

export function useScrollToTop(mainRef: React.RefObject<HTMLElement | null>) {
  const { lenis } = useLenis()
  const shouldReduceMotion = useReducedMotion() ?? false
  const scrollY = useMotionValue(0)
  const activeRunRef = useRef<ActiveScrollRun | null>(null)
  const [avatarPulse, setAvatarPulse] = useState(0)

  const finalize = useCallback(
    (run: ActiveScrollRun, snapToTop: boolean) => {
      if (run.finalized) return
      run.finalized = true
      run.controls?.stop()

      if (snapToTop) {
        lenis?.scrollTo(0, { immediate: true })
        scrollY.set(0)
      }

      run.element.style.paddingTop = run.topPadding
      run.element.style.paddingBottom = run.bottomPadding
      lenis?.resize()
      if (activeRunRef.current === run) activeRunRef.current = null
    },
    [lenis, scrollY]
  )

  const scrollToTop = useCallback(() => {
    const main = mainRef.current
    if (!lenis || !main || activeRunRef.current) return

    if (shouldReduceMotion) {
      lenis.scrollTo(0, { immediate: true })
      scrollY.set(0)
      return
    }

    const run: ActiveScrollRun = {
      avatarTriggered: false,
      bottomPadding: main.style.paddingBottom,
      controls: null,
      element: main,
      finalized: false,
      topPadding: main.style.paddingTop,
    }
    activeRunRef.current = run

    const overshoot = ANIMATION.SCROLL_OVERSHOOT_AMOUNT
    main.style.paddingTop = `${overshoot}px`
    main.style.paddingBottom = `${overshoot}px`
    lenis.resize()

    const adjustedScroll = lenis.scroll + overshoot
    lenis.scrollTo(adjustedScroll, { immediate: true })
    scrollY.set(adjustedScroll)

    run.controls = animate(scrollY, adjustedScroll + overshoot, {
      duration: ANIMATION.SCROLL_OVERSHOOT_DURATION,
      ease: EASING.EASE_OUT_CUBIC,
      onUpdate: (latest) => lenis.scrollTo(latest, { immediate: true }),
      onComplete: () => {
        if (run.finalized || activeRunRef.current !== run) return
        run.controls = animate(scrollY, overshoot, {
          type: "spring",
          stiffness: ANIMATION.SCROLL_SPRING_STIFFNESS,
          damping: ANIMATION.SCROLL_SPRING_DAMPING,
          onUpdate: (latest) => {
            lenis.scrollTo(latest, { immediate: true })
            if (!run.avatarTriggered && latest <= overshoot + 16) {
              run.avatarTriggered = true
              setAvatarPulse((pulse) => pulse + 1)
            }
          },
          onComplete: () => finalize(run, true),
        })
      },
    })
  }, [finalize, lenis, mainRef, scrollY, shouldReduceMotion])

  useEffect(
    () => () => {
      const run = activeRunRef.current
      if (run) finalize(run, false)
    },
    [finalize]
  )

  return { avatarPulse, scrollToTop }
}
