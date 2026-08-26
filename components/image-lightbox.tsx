"use client"

import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion"
import Image, { getImageProps } from "next/image"
import { useEffect, useRef, useState, useCallback, useId, useMemo, type RefObject } from "react"
import { preload } from "react-dom"
import blurDataMap from "@/lib/image-blur-data.json"
import { normalizeImagePath } from "@/lib/image-utils"
import { calculateTransformOrigin } from "@/lib/image-lightbox-utils"

interface ImageLightboxProps {
  isOpen: boolean
  images: string[]
  imageFolder: string
  currentIndex: number
  clickedImageRect: DOMRect | null
  projectName: string
  returnFocusRef: RefObject<HTMLElement | null>
  onClose: () => void
  onNavigate: (index: number) => void
}

const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const
const LIGHTBOX_IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"

type LightboxImageState = "loading" | "loaded" | "error"

interface LightboxImageFrameProps {
  blurDataURL: string | null
  imageCount: number
  imageIndex: number
  imageSrc: string
  projectName: string
}

export function getLightboxPreloadIndices(imageCount: number, currentIndex: number) {
  if (imageCount <= 0 || currentIndex < 0 || currentIndex >= imageCount) return []

  return Array.from(
    new Set([currentIndex, (currentIndex + 1) % imageCount, (currentIndex - 1 + imageCount) % imageCount])
  )
}

export function preloadLightboxImages(images: string[], imageFolder: string, currentIndex: number) {
  getLightboxPreloadIndices(images.length, currentIndex).forEach((index) => {
    const image = images[index]
    if (!image) return

    const source = normalizeImagePath(image, imageFolder)
    const { props } = getImageProps({
      src: source,
      alt: "",
      fill: true,
      sizes: LIGHTBOX_IMAGE_SIZES,
      quality: 95,
    })

    preload(props.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
    })
  })
}

function LightboxImageFrame({ blurDataURL, imageCount, imageIndex, imageSrc, projectName }: LightboxImageFrameProps) {
  const [imageState, setImageState] = useState<LightboxImageState>("loading")
  const imageDescription = `${projectName}, image ${imageIndex + 1} of ${imageCount}`

  const handleImageLoad = useCallback(() => {
    setImageState((currentState) => (currentState === "loading" ? "loaded" : currentState))
  }, [])
  const handleImageError = useCallback(() => {
    setImageState((currentState) => (currentState === "loading" ? "error" : currentState))
  }, [])

  return (
    <div
      data-testid="lightbox-image-frame"
      data-image-state={imageState}
      className="relative w-[min(75vw,calc((100vh-92px)*348/196))] max-w-[1200px]"
      style={{ aspectRatio: "348 / 196", maxHeight: "calc(100vh - 92px)" }}
    >
      {blurDataURL && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
            transform: "scale(1.1)",
            opacity: imageState === "loading" ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
          aria-hidden="true"
        />
      )}
      <Image
        src={imageSrc}
        alt={imageDescription}
        aria-hidden={imageState === "error" ? true : undefined}
        fill
        className={`object-contain scale-[1.005] transition-opacity duration-300 ${
          imageState === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        sizes={LIGHTBOX_IMAGE_SIZES}
        quality={95}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL || undefined}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ willChange: "opacity" }}
      />
      {imageState === "error" && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="absolute inset-0 flex items-center justify-center bg-background px-8 text-center text-sm font-medium text-foreground"
        >
          Could not load image {imageIndex + 1} of {imageCount} for {projectName}.
        </p>
      )}
    </div>
  )
}

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
  projectName,
  returnFocusRef,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogTitleId = useId()
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null)

  // Calculate transform origin from clicked image position (memoized)
  const transformOrigin = useMemo(
    () => calculateTransformOrigin(clickedImageRect, prefersReducedMotion ?? false),
    [clickedImageRect, prefersReducedMotion]
  )

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
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || (e.shiftKey && e.key !== "Tab")) return

      if (e.key === "Tab") {
        const focusableElements = Array.from(
          containerRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        ).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true")

        const firstFocusableElement = focusableElements[0]
        const lastFocusableElement = focusableElements[focusableElements.length - 1]
        if (!firstFocusableElement || !lastFocusableElement) return

        const activeElement = document.activeElement
        const activeIndex = focusableElements.findIndex((element) => element === activeElement)
        const nextIndex = e.shiftKey
          ? activeIndex <= 0
            ? focusableElements.length - 1
            : activeIndex - 1
          : activeIndex < 0 || activeIndex === focusableElements.length - 1
            ? 0
            : activeIndex + 1

        e.preventDefault()
        focusableElements[nextIndex].focus({ preventScroll: true })
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "Home") {
        e.preventDefault()
        // Jump to first image
        if (images.length > 0) {
          onNavigate(0)
        }
      } else if (e.key === "End") {
        e.preventDefault()
        // Jump to last image
        if (images.length > 0) {
          onNavigate(images.length - 1)
        }
      }
    },
    [onClose, handlePrev, handleNext, images.length, onNavigate]
  )

  // Initial focus and exact opener restoration are tied only to the open lifecycle.
  useEffect(() => {
    if (!isOpen) return

    const returnFocusElement = returnFocusRef.current
    closeButtonRef.current?.focus({ preventScroll: true })

    return () => {
      if (returnFocusElement?.isConnected) {
        returnFocusElement.focus({ preventScroll: true })
      }
    }
  }, [isOpen, returnFocusRef])

  // Navigation updates the listener without replaying focus setup or restoration.
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Memoize image variants
  const imageVariants = useMemo(() => createImageVariants(prefersReducedMotion ?? false), [prefersReducedMotion])

  // Memoize image source
  const imageSrc = useMemo(() => {
    const currentImage = images[currentIndex]
    return currentImage ? normalizeImagePath(currentImage, imageFolder) : ""
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

  // Preload adjacent images when lightbox opens or index changes
  useEffect(() => {
    if (!isOpen) return

    preloadLightboxImages(images, imageFolder, currentIndex)
  }, [isOpen, currentIndex, images, imageFolder])

  const canGoPrev = images.length > 1
  const canGoNext = images.length > 1

  // Memoize click handlers
  const handleBackdropClick = useCallback(() => onClose(), [onClose])
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === containerRef.current) {
        onClose()
      }
    },
    [onClose]
  )
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
            data-testid="image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={handleContainerClick}
          >
            <h2 id={dialogTitleId} className="sr-only">
              Image viewer for {projectName}
            </h2>
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              Image {currentIndex + 1} of {images.length} for {projectName}
            </p>
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative pointer-events-auto flex items-center justify-center"
              style={{
                transformOrigin: (prefersReducedMotion ?? false) ? "center center" : transformOrigin,
                maxWidth: "100vw",
                maxHeight: "100vh",
                width: "fit-content",
                height: "fit-content",
              }}
              onClick={handleImageClick}
              onMouseLeave={handleMouseLeave}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm transition-transform hover:bg-background active:scale-95 md:-right-14 md:top-0"
                aria-label="Close image viewer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-foreground"
                  aria-hidden="true"
                >
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Image */}
              <div className="relative rounded-lg overflow-hidden border-[3px] border-border shadow-2xl flex items-center justify-center p-0 box-border">
                <LightboxImageFrame
                  key={imageSrc}
                  blurDataURL={blurDataURL}
                  imageCount={images.length}
                  imageIndex={currentIndex}
                  imageSrc={imageSrc}
                  projectName={projectName}
                />

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
                  onMouseEnter={handleHoverLeft}
                  onFocus={handleHoverLeft}
                  onBlur={handleMouseLeave}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-x-0 active:scale-95 transition-opacity transition-transform duration-200 ease md:-left-14 ${
                    hoverSide === "left"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-auto translate-x-2"
                  }`}
                  aria-label="Previous image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-foreground"
                    aria-hidden="true"
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

              {/* Dot indicators */}
              {images.length > 1 && (
                <div
                  role="group"
                  aria-label="Choose image"
                  className="pointer-events-auto absolute top-full left-1/2 -translate-x-1/2 mt-4 flex items-center gap-2"
                >
                  {images.map((_, index) => {
                    const isActive = index === currentIndex
                    return (
                      <motion.button
                        key={index}
                        type="button"
                        onClick={() => onNavigate(index)}
                        className={`h-2.5 rounded-full border transition-colors ${
                          isActive
                            ? "bg-foreground border-foreground"
                            : "bg-background/70 border-border hover:bg-foreground/40"
                        }`}
                        animate={{
                          width: isActive ? "1.5rem" : "0.625rem", // 24px for active, 10px for inactive
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 22,
                        }}
                        aria-label={`Go to image ${index + 1}`}
                        aria-current={isActive ? "true" : undefined}
                      />
                    )
                  })}
                </div>
              )}

              {canGoNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  onMouseEnter={handleHoverRight}
                  onFocus={handleHoverRight}
                  onBlur={handleMouseLeave}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 dark:bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-x-0 active:scale-95 transition-opacity transition-transform duration-200 ease md:-right-14 ${
                    hoverSide === "right"
                      ? "opacity-100 pointer-events-auto translate-x-0"
                      : "opacity-0 pointer-events-auto -translate-x-2"
                  }`}
                  aria-label="Next image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-foreground"
                    aria-hidden="true"
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
