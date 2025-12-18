"use client"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface ImageLightboxProps {
  isOpen: boolean
  images: string[]
  imageFolder: string
  currentIndex: number
  clickedImageRect: DOMRect | null
  onClose: () => void
  onNavigate: (index: number) => void
}

const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const

export function ImageLightbox({
  isOpen,
  images,
  imageFolder,
  currentIndex,
  clickedImageRect,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null)

  // Calculate transform origin from clicked image position
  const getTransformOrigin = () => {
    if (!clickedImageRect) return "center center"
    
    const centerX = clickedImageRect.left + clickedImageRect.width / 2
    const centerY = clickedImageRect.top + clickedImageRect.height / 2
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    
    // Calculate percentage from viewport center
    const originX = ((centerX - viewportCenterX) / window.innerWidth) * 100 + 50
    const originY = ((centerY - viewportCenterY) / window.innerHeight) * 100 + 50
    
    return `${originX}% ${originY}%`
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
        onNavigate(prevIndex)
      } else if (e.key === "ArrowRight") {
        const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
        onNavigate(nextIndex)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex, images.length, onClose, onNavigate])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: EASE_OUT_CUBIC,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: EASE_OUT_CUBIC,
      },
    },
  }

  const imageVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.15 : 0.25,
        ease: EASE_OUT_CUBIC,
      },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      transition: {
        duration: 0.2,
        ease: EASE_OUT_CUBIC,
      },
    },
  }

  const currentImage = images[currentIndex]
  const imageSrc = currentImage?.startsWith("/")
    ? currentImage
    : `${imageFolder}/${currentImage}`

  const canGoPrev = images.length > 1
  const canGoNext = images.length > 1

  const handlePrev = () => {
    if (canGoPrev) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
      onNavigate(prevIndex)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
      onNavigate(nextIndex)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Lightbox Container */}
          <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => {
              // Close if clicking outside the image
              if (e.target === containerRef.current) {
                onClose()
              }
            }}
          >
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative pointer-events-auto flex items-center justify-center"
              style={{
                transformOrigin: prefersReducedMotion
                  ? "center center"
                  : getTransformOrigin(),
                maxWidth: "100vw",
                maxHeight: "100vh",
                width: "fit-content",
                height: "fit-content",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={() => setHoverSide(null)}
            >
              {/* Image */}
              <div className="relative rounded-lg overflow-hidden border-[3px] border-border shadow-2xl flex items-center justify-center p-0 box-border">
                <div
                  className="relative w-[75vw] max-w-[1200px]"
                  style={{ aspectRatio: "348 / 196", maxHeight: "100vh" }}
                >
                  <Image
                    src={imageSrc}
                    alt={`Lightbox image ${currentIndex + 1}`}
                    fill
                    className="object-contain scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 75vw"
                    priority
                  />
                </div>

                {/* Hover zones for showing controls (no direct navigation click) */}
                <div className="pointer-events-none absolute inset-0">
                  {canGoPrev && (
                    <div
                      className="pointer-events-auto h-full w-1/2 cursor-default"
                      onMouseEnter={() => setHoverSide("left")}
                      aria-hidden="true"
                    />
                  )}
                  {canGoNext && (
                    <div
                      className="pointer-events-auto absolute right-0 top-0 h-full w-1/2 cursor-default"
                      onMouseEnter={() => setHoverSide("right")}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {canGoPrev && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-opacity transition-transform duration-200 ease ${
                    hoverSide === "left"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-none -translate-x-2"
                  }`}
                  aria-label="Previous image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-foreground"
                  >
                    <path
                      d="M12.5 15L7.5 10L12.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {canGoNext && (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-opacity transition-transform duration-200 ease ${
                    hoverSide === "right"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-none translate-x-2"
                  }`}
                  aria-label="Next image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-foreground"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
