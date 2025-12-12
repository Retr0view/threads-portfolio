import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { SmoothScroll } from "@/components/smooth-scroll"

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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={openRunde.className}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}



