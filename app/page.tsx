"use client"

import Link from "next/link"
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useMemo, useCallback, useState } from "react"
import { IntroSection, BIO_ANIMATION_END } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"
import { useLenis } from "@/components/smooth-scroll"

// Memoize work groups rendering with pre-calculated delays
function MemoizedWorkGroups({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  // Pre-calculate all animation delays
  const workGroupItems = useMemo(() => {
    const firstDividerDelay = BIO_ANIMATION_END + 0.3 + 0.1
    const lastDividerDelay = BIO_ANIMATION_END + ((workGroups.length - 1) * 0.12) + 0.3 + 0.1
    
    const items: React.ReactNode[] = [
      <Divider key="first-divider" delay={firstDividerDelay} shouldReduceMotion={shouldReduceMotion} />
    ]

    workGroups.forEach((workGroup, index) => {
      const workGroupDelay = BIO_ANIMATION_END + (index * 0.12)
      const workGroupFinishTime = workGroupDelay + 0.3
      const dividerDelay = workGroupFinishTime + 0.1

      items.push(
        <motion.div
          key={workGroup.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.645, 0.045, 0.355, 1],
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
        duration: 0.3, 
        ease: [0.215, 0.61, 0.355, 1],
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
  const [shouldScaleAvatar, setShouldScaleAvatar] = useState(false)

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

  const scrollToTop = useCallback(() => {
    if (lenis && !isAnimatingRef.current && mainRef.current) {
      isAnimatingRef.current = true
      const currentScroll = lenis.scroll
      const overshootAmount = 100 // pixels to overshoot
      
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
        duration: 0.2,
        ease: [0.215, 0.61, 0.355, 1], // ease-out-cubic
        onUpdate: (latest) => {
          lenis.scrollTo(latest, { immediate: true })
        },
      }).then(() => {
        // Then spring to top (accounting for top padding) - less bouncy spring
        // Estimate spring duration (~0.4s) and start avatar animation 0.05s before it ends
        const estimatedSpringDuration = 0.4
        const avatarStartDelay = estimatedSpringDuration - 0.05
        const avatarTimeout = setTimeout(() => {
          setShouldScaleAvatar(true)
        }, avatarStartDelay * 1000)
        
        animate(scrollY, overshootAmount, {
          type: "spring",
          stiffness: 400,
          damping: 30,
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

  const handleBackToTopClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop()
  }, [scrollToTop])

  return (
    <main ref={mainRef} className="min-h-screen bg-background overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[620px] flex-col px-3 xs:px-6 pt-10 pb-32 xs:pt-32">
        <IntroSection shouldScaleAvatar={shouldScaleAvatar} onAvatarAnimationComplete={() => setShouldScaleAvatar(false)} />
        <section className="mt-[98px] flex flex-col gap-8 xs:gap-16 px-[1px]">
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
            duration: 0.3, 
            ease: [0.645, 0.045, 0.355, 1],
            delay: BIO_ANIMATION_END + (workGroups.length * 0.12) + 0.12
          }}
          className="mt-16 flex items-center justify-center"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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

