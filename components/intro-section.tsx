"use client"

import { Image } from "@unpic/react/nextjs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import lastCommitDateData from "@/lib/last-commit-date.json"

const socialLinks = [
  { name: "Twitter", icon: "/icons/twitter.svg", url: "https://x.com/RianTouag" },
  { name: "Telegram", icon: "/icons/Telegram.svg", url: "https://t.me/Coinlandingpage" },
  { name: "LinkedIn", icon: "/icons/linkedin.svg", url: "https://www.linkedin.com/in/rian-velders-05a5889b/" },
]

// Bio text - date from last git commit
const BIO_UPDATED_DATE = new Date(lastCommitDateData.date)

const bioText = {
  first: "Senior product designer with engineering depth. Making things that work the way people expect them to.",
  second: "From concept through launch and beyond, I work with founders and startups. The focus is on what matters: designs that work, feel right, and don't get in the way. Every detail serves the experience, not the other way around.",
}

export function IntroSection() {
  const [profileError, setProfileError] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

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

  const updatedDate = formatDate(BIO_UPDATED_DATE)
  return (
    <div className="flex flex-col gap-10 px-3 sm:px-0">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]">
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
          <p className="text-sm font-medium leading-none text-muted-foreground">
            {updatedDate}
          </p>
        </div>
      </div>

      {/* Bio Text */}
      <div className="flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground">
        <p>{bioText.first}</p>
        <p>{bioText.second}</p>
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-2">
        {socialLinks.map((social) => (
          <motion.div
            key={social.name}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-9 items-center justify-center gap-2 rounded-[22px] bg-[#f5f5f5] px-4 transition-colors"
              aria-label={social.name}
            >
              <img
                src={social.icon}
                alt={social.name}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium leading-none text-muted-foreground transition-colors group-hover:text-foreground">
                {social.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

