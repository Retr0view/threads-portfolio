"use client"

import Link from "next/link"
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useMemo, useCallback, useState } from "react"
import { IntroSection, BIO_ANIMATION_END } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"
import { useLenis } from "@/components/smooth-scroll"
import { ANIMATION, EASING } from "@/lib/constants"
import { useScrollToTop } from "@/lib/hooks/use-scroll-to-top"

// Memoize work groups rendering with pre-calculated delays
function MemoizedWorkGroups({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  // Pre-calculate all animation delays
  const workGroupItems = useMemo(() => {
    const firstDividerDelay = BIO_ANIMATION_END + ANIMATION.WORK_GROUP_DURATION + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP
    const lastDividerDelay = BIO_ANIMATION_END + ((workGroups.length - 1) * ANIMATION.WORK_GROUP_STAGGER) + ANIMATION.WORK_GROUP_DURATION + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP
    
    const items: React.ReactNode[] = [
      <Divider key="first-divider" delay={firstDividerDelay} shouldReduceMotion={shouldReduceMotion} />
    ]

    workGroups.forEach((workGroup, index) => {
      const workGroupDelay = BIO_ANIMATION_END + (index * ANIMATION.WORK_GROUP_STAGGER)
      const workGroupFinishTime = workGroupDelay + ANIMATION.WORK_GROUP_DURATION
      const dividerDelay = workGroupFinishTime + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP

      items.push(
        <motion.div
          key={workGroup.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ 
            duration: ANIMATION.WORK_GROUP_DURATION, 
            ease: EASING.EASE_IN_OUT_CUBIC,
            delay: workGroupDelay
          }}
        >
          <WorkGroup workGroup={workGroup} />
        </motion.div>
      )

      if (index < workGroups.length - 1) {
        items.push(
          <Divider key={`divider-${workGroup.id}`} delay={dividerDelay} shouldReduceMotion={shouldReduceMotion} />
        )
      }
    })

    items.push(
      <Divider key="last-divider" delay={lastDividerDelay} shouldReduceMotion={shouldReduceMotion} />
    )

    return items
  }, [shouldReduceMotion])

  return <>{workGroupItems}</>
}

const Divider = ({ delay, shouldReduceMotion }: { delay: number; shouldReduceMotion: boolean }) => (
  <motion.div
    className="flex h-[9px] items-center justify-center py-1 overflow-hidden"
  >
    <motion.div
      initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
      animate={shouldReduceMotion ? {} : { scaleX: 1, opacity: 1 }}
      transition={{ 
        duration: ANIMATION.WORK_GROUP_DURATION, 
        ease: EASING.EASE_OUT_CUBIC,
        delay
      }}
      style={{ transformOrigin: "left" }}
      className="h-px w-full bg-border"
    />
  </motion.div>
)

export default function Home() {
  const scrollY = useMotionValue(0)
  const { lenis } = useLenis()
  const isAnimatingRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion() ?? false
  
  const { scrollToTop, shouldScaleAvatar, onAvatarAnimationComplete } = useScrollToTop(
    scrollY,
    mainRef,
    isAnimatingRef
  )

  // Memoize scroll handler
  const handleScroll = useCallback(({ scroll }: { scroll: number }) => {
    if (!isAnimatingRef.current) {
      scrollY.set(scroll)
    }
  }, [scrollY])

  useEffect(() => {
    if (!lenis) return

    // Set initial scroll position
    scrollY.set(lenis.scroll)

    // Update scrollY when Lenis scrolls (but not during our custom animation)
    lenis.on("scroll", handleScroll)

    return () => {
      lenis.off("scroll", handleScroll)
    }
  }, [lenis, scrollY, handleScroll])


  const handleBackToTopClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop()
  }, [scrollToTop])

  return (
    <main ref={mainRef} className="min-h-screen bg-background overflow-x-hidden">
      {/* Skip to content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to content
      </a>
      <div id="main-content" className="mx-auto flex w-full max-w-[620px] flex-col px-3 xs:px-6 pt-10 pb-24 xs:pt-24">
        <IntroSection shouldScaleAvatar={shouldScaleAvatar} onAvatarAnimationComplete={onAvatarAnimationComplete} />
        <section className="mt-24 flex flex-col gap-8 xs:gap-16 px-[1px]">
          {/* Social links and work groups start after bio text animation completes */}
          {/* Work groups stagger with 0.12s between each, duration 0.3s */}
          {/* Dividers animate after each work group finishes (delay + 0.3s + 0.1s gap) */}
          <MemoizedWorkGroups shouldReduceMotion={shouldReduceMotion} />
        </section>
        {/* Back to top button */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ 
            duration: ANIMATION.WORK_GROUP_DURATION, 
            ease: EASING.EASE_IN_OUT_CUBIC,
            delay: BIO_ANIMATION_END + (workGroups.length * ANIMATION.WORK_GROUP_STAGGER) + ANIMATION.WORK_GROUP_STAGGER
          }}
          className="mt-24 flex items-center justify-center"
        >
          <motion.div
            whileTap={{ scale: ANIMATION.SOCIAL_LINK_TAP_SCALE }}
            transition={{ type: "spring", stiffness: ANIMATION.AVATAR_SCALE_ANIMATION_STIFFNESS, damping: 17 }}
          >
            <Link
              href="#top"
              onClick={handleBackToTopClick}
              className="flex h-9 items-center justify-center rounded-[22px] bg-muted px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to the top
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}

