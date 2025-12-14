import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { SmoothScroll } from "@/components/smooth-scroll"
import { use } from "react"

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
  title: "Portfolio",
  description: "A modern portfolio site",
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params?: Promise<Record<string, string | string[]>>
}>) {
  // Unwrap params if present to prevent enumeration errors
  // In Next.js 15+, params is a Promise and must be unwrapped
  if (params) {
    use(params) // Unwrap to prevent React from enumerating the Promise
  }
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${openRunde.className} overflow-x-hidden`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}



