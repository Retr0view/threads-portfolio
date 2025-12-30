import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { SmoothScroll } from "@/components/smooth-scroll"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeInit } from "@/components/theme-init"
import { siteConfig, socialLinks } from "@/lib/site-config"

const openRunde = localFont({
  src: [
    {
      path: "../fonts/OpenRunde-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/OpenRunde-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/OpenRunde-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/OpenRunde-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-open-runde",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: siteConfig.category,
  applicationName: `${siteConfig.name} Portfolio`,
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: siteConfig.language,
    url: siteConfig.url,
    siteName: `${siteConfig.name} Portfolio`,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Senior Product Designer Portfolio`,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Senior Product Designer Portfolio`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "en-US": siteConfig.url,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/og-assets/favicon 32.jpg", sizes: "32x32", type: "image/jpeg" },
      { url: "/og-assets/favicon 64.jpg", sizes: "64x64", type: "image/jpeg" },
      { url: "/og-assets/favicon 128.jpg", sizes: "128x128", type: "image/jpeg" },
    ],
    apple: [
      { url: "/og-assets/favicon 128.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
  },
  // Add verification if provided
  ...(siteConfig.verification?.google && {
    verification: {
      google: siteConfig.verification.google,
    },
  }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#1c1917" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#faf9f6" media="(prefers-color-scheme: light)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": `${siteConfig.url}#person`,
                  name: siteConfig.name,
                  jobTitle: "Senior Product Designer",
                  description: siteConfig.description,
                  url: siteConfig.url,
                  sameAs: socialLinks.map((link) => link.url),
                  image: `${siteConfig.url}/profile/profile picture - rian.jpg`,
                  knowsAbout: [
                    "Product Design",
                    "UI/UX Design",
                    "User Experience",
                    "Interface Design",
                    "Design Systems",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteConfig.url}#website`,
                  url: siteConfig.url,
                  name: `${siteConfig.name} Portfolio`,
                  description: siteConfig.description,
                  publisher: {
                    "@id": `${siteConfig.url}#person`,
                  },
                  inLanguage: siteConfig.language,
                },
                {
                  "@type": "WebPage",
                  "@id": `${siteConfig.url}#webpage`,
                  url: siteConfig.url,
                  name: siteConfig.title,
                  description: siteConfig.description,
                  isPartOf: {
                    "@id": `${siteConfig.url}#website`,
                  },
                  about: {
                    "@id": `${siteConfig.url}#person`,
                  },
                  primaryImageOfPage: {
                    "@type": "ImageObject",
                    url: `${siteConfig.url}${siteConfig.ogImage}`,
                  },
                },
                {
                  "@type": "ProfilePage",
                  "@id": `${siteConfig.url}#profile`,
                  url: siteConfig.url,
                  mainEntity: {
                    "@id": `${siteConfig.url}#person`,
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${openRunde.className} overflow-x-hidden`}>
        <ThemeInit />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
