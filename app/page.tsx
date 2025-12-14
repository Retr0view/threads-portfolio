"use client"

import Link from "next/link"
import { motion, useMotionValue } from "framer-motion"
import { useEffect } from "react"
import { IntroSection } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"
import { useLenis } from "@/components/smooth-scroll"

export default function Home() {
  const scrollY = useMotionValue(0)
  const { lenis } = useLenis()

  useEffect(() => {
    if (!lenis) return

    // Set initial scroll position
    scrollY.set(lenis.scroll)

    // Update scrollY when Lenis scrolls
    const handleScroll = ({ scroll }: { scroll: number }) => {
      scrollY.set(scroll)
    }

    lenis.on("scroll", handleScroll)

    return () => {
      lenis.off("scroll", handleScroll)
    }
  }, [lenis, scrollY])

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 0.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
    }
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[620px] flex-col px-3 pt-10 pb-32 sm:pt-32">
        <IntroSection />
        <section className="mt-[98px] flex flex-col gap-8 sm:gap-16 px-[1px]">
          {workGroups.map((workGroup, index) => (
            <WorkGroup 
              key={workGroup.id} 
              workGroup={workGroup} 
              showDivider={index > 0}
            />
          ))}
          {/* Final divider */}
          <div className="flex h-[9px] items-center justify-center py-1">
            <div className="h-px w-full bg-border" />
          </div>
        </section>
        {/* Back to top button */}
        <div className="mt-16 flex items-center justify-center">
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
        </div>
      </div>
    </main>
  )
}

