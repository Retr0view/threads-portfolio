/**
 * Site configuration and metadata
 * Centralized configuration for SEO, social links, and site information
 */

export const siteConfig = {
  name: "Rian Touag",
  title: "Rian Touag - Senior Product Designer",
  description: "Senior product designer with an engineer's eye. Making things that work the way people expect them to.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://riantouag.com", // Update with actual domain
  ogImage: "/og-assets/OG image.jpg", // Recommended: 1200x630px
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



