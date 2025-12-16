"use client"

import { Image } from "@unpic/react/nextjs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import lastCommitDateData from "@/lib/last-commit-date.json"

const socialLinks = [
  { name: "Twitter", icon: "/icons/twitter.svg", url: "https://x.com/RianTouag" },
  { name: "Telegram", icon: "/icons/Telegram.svg", url: "https://t.me/Coinlandingpage" },
  { name: "LinkedIn", icon: "/icons/linkedin.svg", url: "https://www.linkedin.com/in/rian-velders-05a5889b/" },
]

// Bio text - date from last git commit
const BIO_UPDATED_DATE = new Date(lastCommitDateData.date)

const bioText = {
  first: "Senior product designer with an engineer's eye. Making things that work the way people expect them to.",
  second: "From concept through launch and beyond, I work with founders and startups. The focus is on what matters: designs that work, feel right, and don't get in the way. Every detail serves the experience, not the other way around.",
}

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
            duration: 0.3,
            delay: delay + index * 0.03,
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

export function IntroSection() {
  const [profileError, setProfileError] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const formatDate = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `Updated ${day} ${month} ${year}`
  }

  // Calculate when text animation finishes
  // First paragraph: delay 0.1, ~18 words, last word: 0.1 + 17*0.03 = 0.61, + duration 0.3 = ~0.91s
  // Second paragraph: delay 0.4, ~40 words, last word: 0.4 + 39*0.03 = 1.57, + duration 0.3 = ~1.87s
  // Start social links animation after text completes (1.87s) with a small gap (0.1s) = ~2.0s
  const socialLinksStartDelay = 2.0
  const updatedDate = formatDate(BIO_UPDATED_DATE)
  return (
    <div className="flex flex-col gap-10 px-3 sm:px-0">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] dark:shadow-none">
          {!profileError ? (
            <Image
              src="/profile/profile picture - rian.jpg"
              alt="Profile picture"
              width={44}
              height={44}
              className="object-cover w-full h-full"
              {...(isDesktop && { unoptimized: true })}
              priority
              onError={() => setProfileError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              RT
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium leading-none tracking-[-0.16px] text-foreground">
            Rian Touag
          </p>
          <p className="text-sm font-normal leading-none text-muted-foreground">
            {updatedDate}
          </p>
        </div>
      </div>

      {/* Bio Text */}
      <div className="flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground">
        <p>
          <AnimatedText text={bioText.first} delay={0.1} />
        </p>
        <p>
          <AnimatedText text={bioText.second} delay={0.4} />
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

