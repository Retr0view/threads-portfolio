"use client"

import Link from "next/link"
import { motion, useMotionValue, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import { IntroSection } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"
import { useLenis } from "@/components/smooth-scroll"

export default function Home() {
  const scrollY = useMotionValue(0)
  const { lenis } = useLenis()
  const isAnimatingRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!lenis) return

    // Set initial scroll position
    scrollY.set(lenis.scroll)

    // Update scrollY when Lenis scrolls (but not during our custom animation)
    const handleScroll = ({ scroll }: { scroll: number }) => {
      if (!isAnimatingRef.current) {
        scrollY.set(scroll)
      }
    }

    lenis.on("scroll", handleScroll)

    return () => {
      lenis.off("scroll", handleScroll)
    }
  }, [lenis, scrollY])

  const scrollToTop = () => {
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
        animate(scrollY, overshootAmount, {
          type: "spring",
          stiffness: 400,
          damping: 30,
          onUpdate: (latest) => {
            lenis.scrollTo(latest, { immediate: true })
          },
          onComplete: () => {
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
  }

  const Divider = ({ delay }: { delay: number }) => (
    <motion.div
      className="flex h-[9px] items-center justify-center py-1 overflow-hidden"
    >
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.215, 0.61, 0.355, 1],
          delay
        }}
        style={{ transformOrigin: "left" }}
        className="h-px w-full bg-border"
      />
    </motion.div>
  )

  return (
    <main ref={mainRef} className="min-h-screen bg-background overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[620px] flex-col px-3 sm:px-6 pt-10 pb-32 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.69, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0
          }}
        >
          <IntroSection />
        </motion.div>
        <section className="mt-[98px] flex flex-col gap-8 sm:gap-16 px-[1px]">
          {/* Social links and work groups start at 2.0s simultaneously */}
          {/* Work groups stagger with 0.12s between each, duration 0.69s */}
          {/* Dividers animate after each work group finishes (delay + 0.69s + 0.1s gap) */}
          <Divider delay={2.0 + 0.69 + 0.1} />
          {workGroups.flatMap((workGroup, index) => {
            const workGroupDelay = 2.0 + (index * 0.12)
            const workGroupFinishTime = workGroupDelay + 0.69
            const dividerDelay = workGroupFinishTime + 0.1
            return [
              <motion.div
                key={workGroup.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.69, 
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: workGroupDelay
                }}
              >
                <WorkGroup workGroup={workGroup} />
              </motion.div>,
              ...(index < workGroups.length - 1 ? [
                <Divider key={`divider-${workGroup.id}`} delay={dividerDelay} />
              ] : [])
            ]
          })}
          <Divider delay={2.0 + ((workGroups.length - 1) * 0.12) + 0.69 + 0.1} />
        </section>
        {/* Back to top button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.69, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: 2.0 + (workGroups.length * 0.12) + 0.12
          }}
          className="mt-16 flex items-center justify-center"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                scrollToTop()
              }}
              className="flex h-9 items-center justify-center rounded-[22px] bg-[#f5f5f5] px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to the top
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}

