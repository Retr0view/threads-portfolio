"use client"

import { ANIMATION, EASING } from "@/lib/constants"
import { createIntroAnimationSchedule } from "@/lib/intro-animation"
import lastCommitDateData from "@/lib/last-commit-date.json"
import { socialLinks } from "@/lib/site-config"
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// The tracked date is an explicit portfolio content revision, not a build timestamp.
const BIO_UPDATED_DATE = new Date(lastCommitDateData.date)

const bioParagraphs = [
  "I design in code, working with founders to turn rough ideas into real products.",
  "As a senior product designer with an engineer’s eye, I stay close from the first prototype through launch and whatever comes next.",
  "To me, craft lives in the details: every interaction, edge case, and small decision. Get them right, and they add up to an experience that simply feels right.",
] as const

const introAnimation = createIntroAnimationSchedule(bioParagraphs)

function AnimatedTextByLetter({ text, delay = 0 }: { text: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion()

  return text.split("").map((letter, index) => (
    <motion.span
      key={`${letter}-${index}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : ANIMATION.LETTER_DURATION,
        delay: shouldReduceMotion ? 0 : delay + index * ANIMATION.LETTER_STAGGER,
        ease: EASING.EASE_OUT_CUBIC,
      }}
      style={{ display: "inline-block" }}
    >
      {letter === " " ? "\u00A0" : letter}
    </motion.span>
  ))
}

function AnimatedTextByWord({
  text,
  delay = 0,
  onComplete,
}: {
  text: string
  delay?: number
  onComplete?: () => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(" ")

  return words.map((word, index) => (
    <motion.span
      key={`${word}-${index}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onAnimationComplete={
        !shouldReduceMotion && index === words.length - 1 ? onComplete : undefined
      }
      transition={{
        duration: shouldReduceMotion ? 0 : ANIMATION.WORD_DURATION,
        delay: shouldReduceMotion ? 0 : delay + index * ANIMATION.WORD_STAGGER,
        ease: EASING.EASE_OUT_CUBIC,
      }}
      style={{ display: "inline-block" }}
    >
      {word}
      {index < words.length - 1 && "\u00A0"}
    </motion.span>
  ))
}

export function IntroSection({
  avatarPulse = 0,
  onEntranceComplete,
}: {
  avatarPulse?: number
  onEntranceComplete?: () => void
}) {
  const [profileError, setProfileError] = useState(false)
  const [entranceComplete, setEntranceComplete] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const avatarScale = useMotionValue(shouldReduceMotion ? 1 : ANIMATION.AVATAR_INITIAL_SCALE)
  const entranceCompleteRef = useRef(false)
  const entranceTimerRef = useRef<number | undefined>(undefined)
  const lastAvatarPulseRef = useRef(0)

  const completeEntrance = useCallback(() => {
    if (entranceCompleteRef.current) return
    entranceCompleteRef.current = true
    setEntranceComplete(true)
    onEntranceComplete?.()
  }, [onEntranceComplete])

  const handleBioAnimationComplete = useCallback(() => {
    if (entranceCompleteRef.current || entranceTimerRef.current !== undefined) return
    entranceTimerRef.current = window.setTimeout(
      completeEntrance,
      ANIMATION.BIO_ANIMATION_END_OFFSET * 1000
    )
  }, [completeEntrance])

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

  useEffect(() => {
    if (shouldReduceMotion) completeEntrance()
    return () => {
      if (entranceTimerRef.current !== undefined) {
        window.clearTimeout(entranceTimerRef.current)
      }
    }
  }, [completeEntrance, shouldReduceMotion])

  const formatDate = useCallback((date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `Updated ${day} ${month} ${year}`
  }, [])

  // Memoize date formatting
  const updatedDate = useMemo(() => formatDate(BIO_UPDATED_DATE), [formatDate])

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
            <AnimatedTextByLetter text="Rian Touag" delay={ANIMATION.NAME_DELAY} />
          </p>
          <p className="text-sm font-normal leading-none text-muted-foreground">
            <AnimatedTextByLetter text={updatedDate} delay={ANIMATION.DATE_DELAY} />
          </p>
        </div>
      </div>

      {/* Bio Text */}
      <div
        className="flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground"
        data-testid="intro-biography"
      >
        {introAnimation.paragraphs.map((paragraph, index) => (
          <p key={paragraph.text}>
            <AnimatedTextByWord
              text={paragraph.text}
              delay={paragraph.start}
              onComplete={
                index === introAnimation.paragraphs.length - 1
                  ? handleBioAnimationComplete
                  : undefined
              }
            />
          </p>
        ))}
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
