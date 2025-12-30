"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Error boundary caught:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong!</h1>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-[22px] bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-[22px] bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}



