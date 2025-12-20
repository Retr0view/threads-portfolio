"use client"

import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import blurDataMap from "@/lib/image-blur-data.json"

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

// Extract animation variants to constants outside component
const backdropVariants: Variants = {
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

const createImageVariants = (prefersReducedMotion: boolean): Variants => ({
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
})

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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Calculate transform origin from clicked image position (memoized)
  const transformOrigin = useMemo(() => {
    if (!clickedImageRect) return "center center"
    
    const centerX = clickedImageRect.left + clickedImageRect.width / 2
    const centerY = clickedImageRect.top + clickedImageRect.height / 2
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    
    // Calculate percentage from viewport center
    const originX = ((centerX - viewportCenterX) / window.innerWidth) * 100 + 50
    const originY = ((centerY - viewportCenterY) / window.innerHeight) * 100 + 50
    
    return `${originX}% ${originY}%`
  }, [clickedImageRect])

  // Memoize navigation handlers
  const handlePrev = useCallback(() => {
    if (images.length > 1) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
      onNavigate(prevIndex)
    }
  }, [currentIndex, images.length, onNavigate])

  const handleNext = useCallback(() => {
    if (images.length > 1) {
      const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
      onNavigate(nextIndex)
    }
  }, [currentIndex, images.length, onNavigate])

  // Memoize keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "ArrowLeft") {
      handlePrev()
    } else if (e.key === "ArrowRight") {
      handleNext()
    }
  }, [onClose, handlePrev, handleNext])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleKeyDown])

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

  // Memoize image variants
  const imageVariants = useMemo(
    () => createImageVariants(prefersReducedMotion),
    [prefersReducedMotion]
  )

  // Memoize image source
  const imageSrc = useMemo(() => {
    const currentImage = images[currentIndex]
    return currentImage?.startsWith("/")
      ? currentImage
      : `${imageFolder}/${currentImage}`
  }, [images, currentIndex, imageFolder])

  // Look up blurDataURL for current image
  const blurDataURL = useMemo(() => {
    // Try exact path match first
    let key = imageSrc
    
    // If not found, try without leading slash
    if (!blurDataMap[key as keyof typeof blurDataMap]) {
      key = imageSrc.startsWith("/") ? imageSrc.slice(1) : `/${imageSrc}`
    }
    
    return blurDataMap[key as keyof typeof blurDataMap] || null
  }, [imageSrc])

  // Reset loading state when image changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [imageSrc])

  // Preload adjacent images when lightbox opens or index changes
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return

    // Preload current, next, and previous images
    const imagesToPreload = [
      currentIndex,
      currentIndex + 1 < images.length ? currentIndex + 1 : 0,
      currentIndex - 1 >= 0 ? currentIndex - 1 : images.length - 1,
    ]

    const preloadLinks: HTMLLinkElement[] = []

    imagesToPreload.forEach((index) => {
      const image = images[index]
      const src = image?.startsWith("/")
        ? image
        : `${imageFolder}/${image}`
      
      // Use link rel=preload for high priority loading
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = src
      link.setAttribute("fetchpriority", "high")
      document.head.appendChild(link)
      preloadLinks.push(link)

      // Also preload using Image object for browser cache
      const img = new window.Image()
      img.src = src
    })

    return () => {
      // Clean up link elements on unmount
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [isOpen, currentIndex, images, imageFolder])

  const canGoPrev = images.length > 1
  const canGoNext = images.length > 1

  // Memoize click handlers
  const handleBackdropClick = useCallback(() => onClose(), [onClose])
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      onClose()
    }
  }, [onClose])
  const handleImageClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])
  const handleMouseLeave = useCallback(() => setHoverSide(null), [])
  const handleHoverLeft = useCallback(() => setHoverSide("left"), [])
  const handleHoverRight = useCallback(() => setHoverSide("right"), [])

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
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Lightbox Container */}
          <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={handleContainerClick}
          >
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative pointer-events-auto flex items-center justify-center"
              style={{
                transformOrigin: prefersReducedMotion ? "center center" : transformOrigin,
                maxWidth: "100vw",
                maxHeight: "100vh",
                width: "fit-content",
                height: "fit-content",
              }}
              onClick={handleImageClick}
              onMouseLeave={handleMouseLeave}
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
                    className={`object-contain scale-[1.02] transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
                    quality={95}
                    priority
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    placeholder={blurDataURL ? "blur" : undefined}
                    blurDataURL={blurDataURL || undefined}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    style={{ willChange: "opacity" }}
                  />
                </div>

                {/* Hover zones for showing controls (no direct navigation click) */}
                <div className="pointer-events-none absolute inset-0">
                  {canGoPrev && (
                    <div
                      className="pointer-events-auto h-full w-1/2 cursor-pointer"
                      onMouseEnter={handleHoverLeft}
                      onClick={handlePrev}
                      aria-hidden="true"
                    />
                  )}
                  {canGoNext && (
                    <div
                      className="pointer-events-auto absolute right-0 top-0 h-full w-1/2 cursor-pointer"
                      onMouseEnter={handleHoverRight}
                      onClick={handleNext}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="pointer-events-auto absolute top-full left-1/2 -translate-x-1/2 mt-4 flex items-center gap-2">
                  {images.map((_, index) => {
                    const isActive = index === currentIndex
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onNavigate(index)}
                        className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                          isActive
                            ? "bg-foreground border-foreground"
                            : "bg-background/70 border-border hover:bg-foreground/40"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                        aria-current={isActive ? "true" : undefined}
                      />
                    )
                  })}
                </div>
              )}

              {/* Extended hover zones to keep controls visible while moving to buttons */}
              {canGoPrev && (
                <div
                  className="pointer-events-auto absolute inset-y-0 -left-24 w-24"
                  onMouseEnter={handleHoverLeft}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      onClose()
                    }
                  }}
                  aria-hidden="true"
                />
              )}
              {canGoNext && (
                <div
                  className="pointer-events-auto absolute inset-y-0 -right-24 w-24"
                  onMouseEnter={handleHoverRight}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      onClose()
                    }
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Navigation Arrows */}
              {canGoPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className={`absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-opacity transition-transform duration-200 ease ${
                    hoverSide === "left"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-none translate-x-2"
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className={`absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-opacity transition-transform duration-200 ease ${
                    hoverSide === "right"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-none -translate-x-2"
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
