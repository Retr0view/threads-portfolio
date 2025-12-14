"use client"

import { Image } from "@unpic/react/nextjs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const socialLinks = [
  { name: "Twitter", icon: "/icons/twitter.svg", url: "https://x.com/RianTouag" },
  { name: "Telegram", icon: "/icons/Telegram.svg", url: "https://t.me/Coinlandingpage" },
  { name: "LinkedIn", icon: "/icons/linkedin.svg", url: "https://www.linkedin.com/in/rian-velders-05a5889b/" },
]

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
            Updated 11 Dec 2025
          </p>
        </div>
      </div>

      {/* Bio Text */}
      <div className="flex flex-col gap-4 leading-[1.5] text-sm text-muted-foreground">
        <p>
          Hey, I'm Rian Touag, a product designer with a love for thoughtful, user-centered, and visually crafted experiences.
        </p>
        <p>
          From early concept to polished product, I craft digital experiences that feel intuitive, seamless and quietly delightful. Every detail, from interaction to typography, gets shaped with intention, creating experiences that work beautifully and feel just as good to use.
        </p>
        <p className="font-medium">
          TLDR;
        </p>
        <p>
          I work with founders and startups to create intuitive, purpose-driven design for users.
        </p>
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

