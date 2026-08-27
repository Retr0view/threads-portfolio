"use client"

import { IntroSection } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { ANIMATION, EASING } from "@/lib/constants"
import { useScrollToTop } from "@/lib/hooks/use-scroll-to-top"
import { portfolioProjects as workGroups } from "@/lib/portfolio-view-model"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { useCallback, useMemo, useRef, useState } from "react"

const PORTFOLIO_LCP_WORK_GROUP_ID = "neutron-rebrand"

// Memoize work groups rendering with pre-calculated delays
function MemoizedWorkGroups({
  revealed,
  shouldReduceMotion,
}: {
  revealed: boolean
  shouldReduceMotion: boolean
}) {
  // Pre-calculate all animation delays
  const workGroupItems = useMemo(() => {
    const firstDividerDelay = ANIMATION.WORK_GROUP_DURATION + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP
    const lastDividerDelay = ((workGroups.length - 1) * ANIMATION.WORK_GROUP_STAGGER) + ANIMATION.WORK_GROUP_DURATION + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP
    
    const items: React.ReactNode[] = [
      <Divider key="first-divider" delay={firstDividerDelay} revealed={revealed} shouldReduceMotion={shouldReduceMotion} />
    ]

    workGroups.forEach((workGroup, index) => {
      const workGroupDelay = index * ANIMATION.WORK_GROUP_STAGGER
      const workGroupFinishTime = workGroupDelay + ANIMATION.WORK_GROUP_DURATION
      const dividerDelay = workGroupFinishTime + ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP

      items.push(
        <motion.div
          key={workGroup.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion || revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ 
            duration: ANIMATION.WORK_GROUP_DURATION, 
            ease: EASING.EASE_IN_OUT_CUBIC,
            delay: revealed ? workGroupDelay : 0
          }}
        >
          <WorkGroup
            workGroup={workGroup}
            preloadFirstImage={workGroup.id === PORTFOLIO_LCP_WORK_GROUP_ID}
          />
        </motion.div>
      )

      if (index < workGroups.length - 1) {
        items.push(
          <Divider key={`divider-${workGroup.id}`} delay={dividerDelay} revealed={revealed} shouldReduceMotion={shouldReduceMotion} />
        )
      }
    })

    items.push(
      <Divider key="last-divider" delay={lastDividerDelay} revealed={revealed} shouldReduceMotion={shouldReduceMotion} />
    )

    return items
  }, [revealed, shouldReduceMotion])

  return <>{workGroupItems}</>
}

const Divider = ({ delay, revealed, shouldReduceMotion }: { delay: number; revealed: boolean; shouldReduceMotion: boolean }) => (
  <motion.div
    className="flex h-[9px] items-center justify-center py-1 overflow-hidden"
  >
    <motion.div
      initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
      animate={shouldReduceMotion || revealed ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
      transition={{ 
        duration: ANIMATION.WORK_GROUP_DURATION, 
        ease: EASING.EASE_OUT_CUBIC,
        delay: revealed ? delay : 0
      }}
      style={{ transformOrigin: "left" }}
      className="h-px w-full bg-border"
    />
  </motion.div>
)

export default function Home() {
  const mainRef = useRef<HTMLElement>(null)
  const [introComplete, setIntroComplete] = useState(false)
  const shouldReduceMotion = useReducedMotion() ?? false
  const { avatarPulse, scrollToTop } = useScrollToTop(mainRef)
  const handleIntroComplete = useCallback(() => setIntroComplete(true), [])

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
        <IntroSection avatarPulse={avatarPulse} onEntranceComplete={handleIntroComplete} />
        <section className="mt-24 flex flex-col gap-8 xs:gap-16 px-[1px]">
          {/* Social links and work groups start after bio text animation completes */}
          {/* Work groups stagger with 0.12s between each, duration 0.3s */}
          {/* Dividers animate after each work group finishes (delay + 0.3s + 0.1s gap) */}
          <MemoizedWorkGroups revealed={introComplete} shouldReduceMotion={shouldReduceMotion} />
        </section>
        {/* Back to top button */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion || introComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ 
            duration: ANIMATION.WORK_GROUP_DURATION, 
            ease: EASING.EASE_IN_OUT_CUBIC,
            delay: introComplete ? (workGroups.length + 1) * ANIMATION.WORK_GROUP_STAGGER : 0
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
