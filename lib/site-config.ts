/**
 * Site configuration and metadata
 * Centralized configuration for SEO, social links, and site information
 */

export const siteConfig = {
  name: "Rian Touag",
  title: "Rian Touag - Senior Product Designer",
  // Concise public metadata; the long-form page bio lives in IntroSection.
  description: "Senior product designer who designs in code with founders and startups, from early ideas through launch, with an engineer's eye and a focus on craft.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://riantouag.com",
  ogImage: "/og-assets/og-image.jpg", // Recommended: 1200x630px
  twitterHandle: "@RianTouag",
  keywords: [
    "product design",
    "UI/UX design",
    "user experience",
    "designer",
    "portfolio",
    "senior product designer",
    "interface design",
    "user interface",
    "design systems",
    "product strategy",
  ],
  category: "Portfolio",
  language: "en-US",
  // Optional: Add verification codes for search engines
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION, // Optional: Google Search Console
    // Add other verification codes as needed
  },
}

export const socialLinks = [
  { name: "Twitter", icon: "/icons/twitter.svg", url: "https://x.com/RianTouag" },
  { name: "Telegram", icon: "/icons/Telegram.svg", url: "https://t.me/Coinlandingpage" },
  { name: "LinkedIn", icon: "/icons/linkedin.svg", url: "https://www.linkedin.com/in/rian-velders-05a5889b/" },
] as const

