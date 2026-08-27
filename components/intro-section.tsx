"use client"

import { ANIMATION, EASING } from "@/lib/constants"
import { useSplitLines } from "@/lib/hooks/use-split-lines"
import lastCommitDateData from "@/lib/last-commit-date.json"
import { socialLinks } from "@/lib/site-config"
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TextMorph } from "torph/react"

// The tracked date is an explicit portfolio content revision, not a build timestamp.
const BIO_UPDATED_DATE = new Date(lastCommitDateData.date)

const bioText = {
  first: "I design in code, working through the details until the product works the way people expect it to.",
  second: "I’m a senior product designer with an engineer’s eye. I work with founders and startups from the first rough idea through launch and whatever comes next.",
  third: "I care deeply about craft. The small decisions, the edge cases, the moments nobody notices unless they feel wrong. Every detail should make the experience better, then get out of the way.",
}

// CSS easing string for torph (matches EASE_OUT_CUBIC)
const TORPH_EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)"

export function IntroSection({
  avatarPulse = 0,
  onEntranceComplete,
}: {
  avatarPulse?: number
  onEntranceComplete?: () => void
}) {
  const [profileError, setProfileError] = useState(false)
  const [completedParagraphCount, setCompletedParagraphCount] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const avatarScale = useMotionValue(shouldReduceMotion ? 1 : ANIMATION.AVATAR_INITIAL_SCALE)
  const completedParagraphsRef = useRef(new Set<number>())
  const lastAvatarPulseRef = useRef(0)

  const markParagraphComplete = useCallback((index: number) => {
    const completed = completedParagraphsRef.current
    if (completed.has(index)) return
    completed.add(index)
    setCompletedParagraphCount(completed.size)
    if (completed.size === 3) onEntranceComplete?.()
  }, [onEntranceComplete])

  const markFirstParagraphComplete = useCallback(() => markParagraphComplete(0), [markParagraphComplete])
  const markSecondParagraphComplete = useCallback(() => markParagraphComplete(1), [markParagraphComplete])
  const markThirdParagraphComplete = useCallback(() => markParagraphComplete(2), [markParagraphComplete])

  const firstParagraphRef = useRef<HTMLParagraphElement>(null)
  const secondParagraphRef = useRef<HTMLParagraphElement>(null)
  const thirdParagraphRef = useRef<HTMLParagraphElement>(null)
  useSplitLines(firstParagraphRef, {
    baseDelayMs: 0,
    onInitialAnimationComplete: markFirstParagraphComplete,
  })
  useSplitLines(secondParagraphRef, {
    baseDelayMs: ANIMATION.INTRO_SECOND_PARA_LINE_BASE_DELAY_MS,
    onInitialAnimationComplete: markSecondParagraphComplete,
  })
  useSplitLines(thirdParagraphRef, {
    baseDelayMs: ANIMATION.INTRO_THIRD_PARA_LINE_BASE_DELAY_MS,
    onInitialAnimationComplete: markThirdParagraphComplete,
  })

  // Text morph state – name/date
  const [nameText, setNameText] = useState("")
  const [dateText, setDateText] = useState("")

  const handleProfileError = useCallback(() => setProfileError(true), [])

  // Initial scale animation on mount
  useEffect(() => {
    if (!shouldReduceMotion) {
      animate(avatarScale, 1, {
        type: "spring",
        stiffness: ANIMATION.AVATAR_SCALE_ANIMATION_STIFFNESS,
        damping: ANIMATION.AVATAR_SCALE_ANIMATION_DAMPING,
      })
    }
  }, [shouldReduceMotion, avatarScale])

  useEffect(() => {
    if (avatarPulse <= lastAvatarPulseRef.current) return
    lastAvatarPulseRef.current = avatarPulse
    if (!shouldReduceMotion) {
      animate(avatarScale, [1, ANIMATION.AVATAR_BOUNCE_SCALE, 1], {
        duration: ANIMATION.DURATION_LONG,
        ease: EASING.EASE_OUT_CUBIC,
      })
    }
  }, [avatarPulse, shouldReduceMotion, avatarScale])

  const formatDate = useCallback((date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `Updated ${day} ${month} ${year}`
  }, [])

  // Memoize date formatting
  const updatedDate = useMemo(() => formatDate(BIO_UPDATED_DATE), [formatDate])

  // Staggered text morph (torph): name/date
  useEffect(() => {
    if (shouldReduceMotion) {
      return
    }

    const timeouts: number[] = []
    timeouts.push(window.setTimeout(() => setNameText("Rian Touag"), ANIMATION.NAME_DELAY * 1000))
    timeouts.push(window.setTimeout(() => setDateText(updatedDate), ANIMATION.DATE_DELAY * 1000))
    return () => timeouts.forEach((id) => window.clearTimeout(id))
  }, [shouldReduceMotion, updatedDate])

  const displayedNameText = shouldReduceMotion ? "Rian Touag" : nameText
  const displayedDateText = shouldReduceMotion ? updatedDate : dateText

  const entranceComplete = completedParagraphCount === 3
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
              preload
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
            <TextMorph
              duration={500}
              ease={TORPH_EASE}
              as="span"
              className="inline"
            >
              {displayedNameText || "\u00A0"}
            </TextMorph>
          </p>
          <p className="text-sm font-normal leading-none text-muted-foreground">
            <TextMorph
              duration={400}
              ease={TORPH_EASE}
              as="span"
              className="inline"
            >
              {displayedDateText || "\u00A0"}
            </TextMorph>
          </p>
        </div>
      </div>

      {/* Bio Text – per-line animation once on load; resize re-splits, no replay */}
      <div className="intro-paragraphs flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground">
        <p ref={firstParagraphRef} className="intro-paragraph-lines">
          {bioText.first}
        </p>
        <p
          ref={secondParagraphRef}
          className="intro-paragraph-lines intro-paragraph-lines-second"
          style={
            {
              "--line-base-delay": `${ANIMATION.INTRO_SECOND_PARA_LINE_BASE_DELAY_MS}ms`,
            } as React.CSSProperties
          }
        >
          {bioText.second}
        </p>
        <p
          ref={thirdParagraphRef}
          className="intro-paragraph-lines intro-paragraph-lines-third"
          style={
            {
              "--line-base-delay": `${ANIMATION.INTRO_THIRD_PARA_LINE_BASE_DELAY_MS}ms`,
            } as React.CSSProperties
          }
        >
          {bioText.third}
        </p>
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-2">
        {socialLinks.map((social, index) => (
          <motion.div
            key={social.name}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={
              shouldReduceMotion || entranceComplete
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 8 }
            }
            whileTap={{ scale: ANIMATION.SOCIAL_LINK_TAP_SCALE }}
            transition={{
              opacity: { duration: ANIMATION.SOCIAL_LINK_DURATION, delay: entranceComplete ? index * ANIMATION.SOCIAL_LINK_STAGGER : 0, ease: EASING.EASE_OUT_CUBIC },
              y: { duration: ANIMATION.SOCIAL_LINK_DURATION, delay: entranceComplete ? index * ANIMATION.SOCIAL_LINK_STAGGER : 0, ease: EASING.EASE_OUT_CUBIC },
              scale: { type: "spring", stiffness: ANIMATION.AVATAR_SCALE_ANIMATION_STIFFNESS, damping: 17 },
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
                className="relative z-10 h-4 w-4 icon-current-color transition-transform group-hover:scale-110"
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
