"use client"

import { Image } from "@unpic/react/nextjs"
import Link from "next/link"
import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { motion, useReducedMotion, useMotionValue, animate } from "framer-motion"
import lastCommitDateData from "@/lib/last-commit-date.json"
import { useIsDesktop } from "@/lib/hooks"

const socialLinks = [
  { name: "Twitter", icon: "/icons/twitter.svg", url: "https://x.com/RianTouag" },
  { name: "Telegram", icon: "/icons/Telegram.svg", url: "https://t.me/Coinlandingpage" },
  { name: "LinkedIn", icon: "/icons/linkedin.svg", url: "https://www.linkedin.com/in/rian-velders-05a5889b/" },
]

// Bio text - date from last git commit
const BIO_UPDATED_DATE = new Date(lastCommitDateData.date)

const bioText = {
  first: "Senior product designer with an engineer's eye. Making things that work the way people expect them to.",
  second: "From concept through launch and beyond, I work with founders and startups. To focus on what matters: designs that work, feel right, and don't get in the way. Every detail serves the experience, not the other way around.",
}

// Animation timing constants (tuned for a snappier feel)
const WORD_STAGGER = 0.008 // delay between each word (was 0.015)
const WORD_DURATION = 0.12 // duration of each word's animation (was 0.15)
const PARAGRAPH_GAP = 0.05 // tiny delay between paragraphs (was 0.08)

// Calculate when a paragraph animation ends
const getAnimationEndTime = (text: string, startDelay: number) => {
  const wordCount = text.split(" ").length
  return startDelay + (wordCount - 1) * WORD_STAGGER + WORD_DURATION
}

// Paragraph timing (starts after avatar/name section animation completes ~0.3s)
const FIRST_PARAGRAPH_START = 0.15
const FIRST_PARAGRAPH_END = getAnimationEndTime(bioText.first, FIRST_PARAGRAPH_START)
const SECOND_PARAGRAPH_START = FIRST_PARAGRAPH_END + PARAGRAPH_GAP
const SECOND_PARAGRAPH_END = getAnimationEndTime(bioText.second, SECOND_PARAGRAPH_START)

// Export for use in page.tsx (work groups start after bio text completes)
export const BIO_ANIMATION_END = SECOND_PARAGRAPH_END + 0.1

// Component for word-by-word animation
function AnimatedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(" ")

  if (shouldReduceMotion) {
    return <span>{text}</span>
  }

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: WORD_DURATION,
            delay: delay + index * WORD_STAGGER,
            ease: [0.215, 0.61, 0.355, 1], // ease-out-cubic
          }}
          style={{ display: "inline-block" }}
        >
          {word}
          {index < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </>
  )
}

export function IntroSection({ shouldScaleAvatar, onAvatarAnimationComplete }: { shouldScaleAvatar?: boolean; onAvatarAnimationComplete?: () => void }) {
  const [profileError, setProfileError] = useState(false)
  const isDesktop = useIsDesktop()
  const shouldReduceMotion = useReducedMotion()
  const avatarScale = useMotionValue(shouldReduceMotion ? 1 : 0.85)
  const hasAnimatedRef = useRef(false)

  const handleProfileError = useCallback(() => setProfileError(true), [])

  // Initial scale animation on mount
  useEffect(() => {
    if (!shouldReduceMotion) {
      animate(avatarScale, 1, {
        type: "spring",
        stiffness: 400,
        damping: 20,
      })
    }
  }, [shouldReduceMotion, avatarScale])

  // Trigger scale animation when shouldScaleAvatar becomes true
  useEffect(() => {
    if (shouldScaleAvatar && !shouldReduceMotion && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      animate(avatarScale, [1, 1.15, 1], {
        duration: 0.4,
        ease: [0.215, 0.61, 0.355, 1],
      }).then(() => {
        hasAnimatedRef.current = false
        if (onAvatarAnimationComplete) {
          onAvatarAnimationComplete()
        }
      })
    }
  }, [shouldScaleAvatar, shouldReduceMotion, avatarScale, onAvatarAnimationComplete])

  const formatDate = useCallback((date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `Updated ${day} ${month} ${year}`
  }, [])

  // Memoize date formatting
  const updatedDate = useMemo(() => formatDate(BIO_UPDATED_DATE), [formatDate])

  // Start social links animation after second paragraph completes with a small gap
  const socialLinksStartDelay = SECOND_PARAGRAPH_END + 0.1
  return (
    <div className="flex flex-col gap-10 px-3 xs:px-0">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5">
        <motion.div
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] dark:shadow-none"
          style={{ scale: avatarScale }}
        >
          {!profileError ? (
            <Image
              src="/profile/profile picture - rian.jpg"
              alt="Profile picture"
              width={44}
              height={44}
              className="object-cover w-full h-full"
              {...(isDesktop && { unoptimized: true })}
              priority
              onError={handleProfileError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              RT
            </div>
          )}
        </motion.div>
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium leading-none tracking-[-0.16px] text-foreground">
            <AnimatedText text="Rian Touag" delay={0.05} />
          </p>
          <p className="text-sm font-normal leading-none text-muted-foreground">
            <AnimatedText text={updatedDate} delay={0.1} />
          </p>
        </div>
      </div>

      {/* Bio Text */}
      <div className="flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground">
        <p>
          <AnimatedText text={bioText.first} delay={FIRST_PARAGRAPH_START} />
        </p>
        <p>
          <AnimatedText text={bioText.second} delay={SECOND_PARAGRAPH_START} />
        </p>
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-2">
        {socialLinks.map((social, index) => (
          <motion.div
            key={social.name}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              opacity: { duration: 0.4, delay: socialLinksStartDelay + index * 0.1, ease: [0.215, 0.61, 0.355, 1] },
              y: { duration: 0.4, delay: socialLinksStartDelay + index * 0.1, ease: [0.215, 0.61, 0.355, 1] },
              scale: { type: "spring", stiffness: 400, damping: 17 },
            }}
          >
            <Link
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-9 items-center justify-center gap-2 rounded-[22px] bg-muted px-4 text-muted-foreground transition-colors hover:text-foreground before:absolute before:inset-0 before:rounded-[22px] before:bg-foreground/[0.03] before:opacity-0 before:transition-opacity hover:before:opacity-100"
              aria-label={social.name}
            >
              <span
                className="relative z-10 h-4 w-4 icon-current-color"
                style={{ WebkitMaskImage: `url(${social.icon})`, maskImage: `url(${social.icon})` }}
                aria-hidden="true"
              />
              <span className="relative z-10 text-sm font-medium leading-none">
                {social.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

