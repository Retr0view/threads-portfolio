"use client"

import { useCallback, useRef, useState } from "react"
import { MotionValue, animate } from "framer-motion"
import { useLenis } from "@/components/smooth-scroll"
import { ANIMATION, EASING } from "@/lib/constants"

/**
 * Hook for smooth scroll-to-top animation with overshoot effect
 * Provides a function to scroll to the top of the page with a spring animation
 * 
 * @param scrollY - Motion value for scroll position (used to coordinate with scroll handler)
 * @param mainRef - Ref to the main element (used for padding manipulation)
 * @param isAnimatingRef - Ref to track if animation is in progress (prevents scroll handler updates)
 * 
 * @returns Object containing:
 *   - scrollToTop: Function to trigger scroll-to-top animation
 *   - shouldScaleAvatar: Boolean indicating when avatar should scale (for animation coordination)
 *   - onAvatarAnimationComplete: Callback to reset avatar scale state
 * 
 * @example
 * const scrollY = useMotionValue(0)
 * const mainRef = useRef<HTMLElement>(null)
 * const isAnimatingRef = useRef(false)
 * const { scrollToTop, shouldScaleAvatar, onAvatarAnimationComplete } = useScrollToTop(scrollY, mainRef, isAnimatingRef)
 * 
 * // Trigger scroll
 * scrollToTop()
 * 
 * // Use avatar state for animation coordination
 * <IntroSection 
 *   shouldScaleAvatar={shouldScaleAvatar} 
 *   onAvatarAnimationComplete={onAvatarAnimationComplete} 
 * />
 */
export function useScrollToTop(
  scrollY: MotionValue<number>,
  mainRef: React.RefObject<HTMLElement | null>,
  isAnimatingRef: React.MutableRefObject<boolean>
) {
  const { lenis } = useLenis()
  const [shouldScaleAvatar, setShouldScaleAvatar] = useState(false)

  const scrollToTop = useCallback(() => {
    if (lenis && !isAnimatingRef.current && mainRef.current) {
      isAnimatingRef.current = true
      const currentScroll = lenis.scroll
      const overshootAmount = ANIMATION.SCROLL_OVERSHOOT_AMOUNT
      
      // Temporarily extend the page at both top and bottom to allow overshoot
      mainRef.current.style.paddingTop = `${overshootAmount}px`
      mainRef.current.style.paddingBottom = `${overshootAmount}px`
      // Force Lenis to recalculate scroll limits
      lenis.resize()
      
      // Adjust scroll position to account for the top padding
      const adjustedScroll = currentScroll + overshootAmount
      lenis.scrollTo(adjustedScroll, { immediate: true })
      scrollY.set(adjustedScroll)
      
      // First, animate to overshoot position (go down) - fast ease-out
      animate(scrollY, adjustedScroll + overshootAmount, {
        duration: ANIMATION.SCROLL_OVERSHOOT_DURATION,
        ease: EASING.EASE_OUT_CUBIC,
        onUpdate: (latest) => {
          lenis.scrollTo(latest, { immediate: true })
        },
      }).then(() => {
        // Then spring to top (accounting for top padding) - less bouncy spring
        // Estimate spring duration and start avatar animation before it ends
        const estimatedSpringDuration = ANIMATION.SCROLL_SPRING_DURATION
        const avatarStartDelay = estimatedSpringDuration - ANIMATION.SCROLL_AVATAR_START_DELAY_OFFSET
        const avatarTimeout = setTimeout(() => {
          setShouldScaleAvatar(true)
        }, avatarStartDelay * 1000)
        
        animate(scrollY, overshootAmount, {
          type: "spring",
          stiffness: ANIMATION.SCROLL_SPRING_STIFFNESS,
          damping: ANIMATION.SCROLL_SPRING_DAMPING,
          onUpdate: (latest) => {
            lenis.scrollTo(latest, { immediate: true })
          },
          onComplete: () => {
            // Clear timeout if spring completed before avatar trigger (shouldn't happen, but safety)
            clearTimeout(avatarTimeout)
            // Scroll to actual top (0) without animation
            lenis.scrollTo(0, { immediate: true })
            scrollY.set(0)
            // Remove the extensions
            if (mainRef.current) {
              mainRef.current.style.paddingTop = ""
              mainRef.current.style.paddingBottom = ""
              lenis.resize()
            }
            // Re-enable scroll listener updates
            isAnimatingRef.current = false
          },
        })
      })
    }
  }, [lenis, scrollY])

  const onAvatarAnimationComplete = useCallback(() => {
    setShouldScaleAvatar(false)
  }, [])

  return {
    scrollToTop,
    shouldScaleAvatar,
    onAvatarAnimationComplete,
    mainRef,
    scrollY,
  }
}

