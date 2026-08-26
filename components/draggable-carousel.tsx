"use client"

import { ANIMATION, BREAKPOINTS, EASING, IMAGE_ASPECT_RATIO } from "@/lib/constants"
import { useBreakpoint } from "@/lib/hooks"
import { motion, useMotionValue, useReducedMotion } from "framer-motion"
import Image from "next/image"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ImageLightbox, preloadLightboxImages } from "./image-lightbox"

interface DraggableCarouselProps {
  images: string[]
  imageFolder: string
  projectName: string
  preloadFirstImage: boolean
}

function DraggableCarouselComponent({ images, imageFolder, preloadFirstImage, projectName }: DraggableCarouselProps) {
  const [width, setWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const isDesktop = useBreakpoint(BREAKPOINTS.MOBILE)
  const [isHovering, setIsHovering] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [clickedImageRect, setClickedImageRect] = useState<DOMRect | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const prefersReducedMotion = useReducedMotion()
  const isDragging = useRef(false)
  const dragStartTime = useRef(0)
  const dragStartX = useRef(0)
  const lightboxOpenerRef = useRef<HTMLButtonElement>(null)

  // Update card width based on viewport (debounced via useBreakpoint)
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const isMobile = window.innerWidth < BREAKPOINTS.MOBILE
        const baseWidth = wrapperRef.current.offsetWidth
        setCardWidth(isMobile ? baseWidth * ANIMATION.CAROUSEL_MOBILE_CARD_WIDTH_RATIO : baseWidth)
      }
    }

    handleResize()

    // Debounce resize handler
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener("resize", debouncedResize, { passive: true })
    return () => {
      window.removeEventListener("resize", debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Calculate drag constraints using ResizeObserver to react to actual dimension changes
  useEffect(() => {
    if (!interactionRef.current || !wrapperRef.current) return

    const interaction = interactionRef.current
    const wrapper = wrapperRef.current

    const updateWidth = () => {
      const carouselWidth = interaction.scrollWidth
      const wrapperWidth = wrapper.offsetWidth
      setWidth(Math.max(0, carouselWidth - wrapperWidth))
    }

    // Use ResizeObserver to recalculate when content dimensions change
    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(interaction)

    // Debounce window resize handler
    let timeoutId: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateWidth, 150)
    }

    window.addEventListener("resize", debouncedUpdate, { passive: true })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", debouncedUpdate)
      clearTimeout(timeoutId)
    }
  }, [images])

  // Prevent browser navigation on horizontal swipe gestures
  useEffect(() => {
    const interaction = interactionRef.current
    if (!interaction) return

    let touchStart: { x: number; y: number } | null = null
    let touchDirection: "pending" | "horizontal" | "vertical" = "pending"

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      touchStart = { x: touch.clientX, y: touch.clientY }
      touchDirection = "pending"
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touchStart || !touch) return

      const diffX = Math.abs(touch.clientX - touchStart.x)
      const diffY = Math.abs(touch.clientY - touchStart.y)

      if (touchDirection === "pending") {
        if (Math.max(diffX, diffY) <= 10) return
        touchDirection = diffX > 10 && diffX > diffY ? "horizontal" : "vertical"
      }

      if (touchDirection === "horizontal" && e.cancelable) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      touchStart = null
      touchDirection = "pending"
    }

    // Prevent browser navigation gestures on wheel events (trackpad)
    // Note: This works alongside the React onWheel handler to catch edge cases
    const handleWheelPrevent = (e: WheelEvent) => {
      // If hovering over carousel, prevent all horizontal scroll gestures
      // Otherwise, only prevent if it's clearly horizontal (not vertical scrolling)
      if (isHovering) {
        // When hovering, prevent any horizontal scroll to avoid browser navigation
        if (Math.abs(e.deltaX) > 0) {
          e.preventDefault()
        }
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault()
      }
    }

    interaction.addEventListener("touchstart", handleTouchStart, { passive: false })
    interaction.addEventListener("touchmove", handleTouchMove, { passive: false })
    interaction.addEventListener("touchend", handleTouchEnd)
    interaction.addEventListener("touchcancel", handleTouchEnd)
    interaction.addEventListener("wheel", handleWheelPrevent, { passive: false })

    return () => {
      interaction.removeEventListener("touchstart", handleTouchStart)
      interaction.removeEventListener("touchmove", handleTouchMove)
      interaction.removeEventListener("touchend", handleTouchEnd)
      interaction.removeEventListener("touchcancel", handleTouchEnd)
      interaction.removeEventListener("wheel", handleWheelPrevent)
    }
  }, [isHovering])

  // Handle wheel/trackpad scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Stop any ongoing drag momentum when scrolling starts
    x.stop()
    
    // Check if horizontal scroll (deltaX) or trackpad horizontal gesture
    if (Math.abs(e.deltaX) > 0 || (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) === 0 && e.shiftKey)) {
      e.preventDefault()
      const delta = e.deltaX !== 0 ? e.deltaX : (e.deltaY * -1) // Shift+scroll converts to horizontal
      const currentX = x.get()
      const newX = Math.max(-width, Math.min(0, currentX - delta))
      x.set(newX)
    }
  }, [x, width])

  // Memoize drag start handler
  const handleDragStart = useCallback(() => {
    isDragging.current = true
    dragStartTime.current = Date.now()
    dragStartX.current = x.get()
  }, [x])

  // Memoize drag end handler
  const handleDragEnd = useCallback(() => {
    const dragDuration = Date.now() - dragStartTime.current
    const dragDistance = Math.abs(x.get() - dragStartX.current)
    // Only consider it a drag if it lasted > 100ms or moved significantly (> 5px)
    if (dragDuration > 100 || dragDistance > 5) {
      // Reset after a short delay to allow click handler
      setTimeout(() => {
        isDragging.current = false
      }, 100)
    } else {
      // Quick tap, reset immediately
      setTimeout(() => {
        isDragging.current = false
      }, 50)
    }
  }, [x])

  const preloadLightboxImage = useCallback((index: number) => {
    preloadLightboxImages(images, imageFolder, index)
  }, [images, imageFolder])

  // Memoize click handler with preloading
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    // Keyboard activation has detail 0 and must not be blocked by a stale pointer-drag latch.
    if (isDesktop && (!isDragging.current || e.detail === 0)) {
      // Start the optimizer-backed request before rendering the lightbox.
      preloadLightboxImage(index)

      lightboxOpenerRef.current = e.currentTarget
      const rect = e.currentTarget.getBoundingClientRect()
      setClickedImageRect(rect)
      setLightboxIndex(index)
      
      // Small delay to allow preload to start, then open lightbox
      requestAnimationFrame(() => {
        setLightboxOpen(true)
      })
    }
  }, [isDesktop, preloadLightboxImage])

  // Memoize hover handlers
  const handleMouseEnter = useCallback(() => setIsHovering(true), [])
  const handleMouseLeave = useCallback(() => setIsHovering(false), [])

  // Memoize pointer down handler
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ensure pointer events are captured even in gap areas
    e.stopPropagation()
  }, [])

  // Memoize lightbox handlers
  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false)
  }, [])
  const handleLightboxNavigate = useCallback((index: number) => setLightboxIndex(index), [])

  const dragConstraints = useMemo(() => width > 0 ? { left: -width, right: 0 } : undefined, [width])

  // If no images, show placeholder
  if (images.length === 0) {
    return null
  }

  return (
    <div
      ref={wrapperRef}
      className="w-full"
    >
      <motion.div
        ref={interactionRef}
        data-testid="carousel-track"
        className="flex gap-3 xs:gap-6 cursor-grab active:cursor-grabbing w-fit select-none"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={ANIMATION.CAROUSEL_DRAG_ELASTIC}
        dragPropagation={false}
        dragTransition={{ bounceStiffness: ANIMATION.CAROUSEL_DRAG_BOUNCE_STIFFNESS, bounceDamping: ANIMATION.CAROUSEL_DRAG_BOUNCE_DAMPING }}
        style={{ x, touchAction: "pan-y", overscrollBehaviorX: "contain", pointerEvents: "auto", backgroundColor: "transparent" }}
        whileDrag={{ cursor: "grabbing" }}
        onWheel={handleWheel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
      >
          {images.map((image, index) => {
          // If image path starts with "/", it's a full path, otherwise use imageFolder
          const imageSrc = image.startsWith("/") ? image : `${imageFolder}/${image}`
          const preloadImage = preloadFirstImage && index === 0
          return (
            <motion.div
              key={imageSrc}
              className="flex shrink-0 flex-col overflow-visible rounded-none border-0 p-0 h-fit select-none"
              style={{ 
                width: cardWidth > 0 ? `${cardWidth}px` : '100%'
              }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { 
                duration: ANIMATION.CAROUSEL_ANIMATION_DURATION, 
                ease: EASING.EASE_IN_OUT_QUART,
                delay: index * ANIMATION.CAROUSEL_STAGGER_DELAY
              }}
              drag={false}
            >
              {isDesktop ? (
                <button
                  type="button"
                  data-carousel-image-index={index}
                  className="relative block w-full overflow-hidden rounded-lg border-[3px] border-border bg-transparent p-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.15),0px_4px_6px_-4px_rgba(0,0,0,0.12)] select-none dark:shadow-none"
                  onClick={(e) => handleImageClick(e, index)}
                  onMouseEnter={() => preloadLightboxImage(index)}
                  onFocus={() => preloadLightboxImage(index)}
                  aria-label={`Open image ${index + 1} of ${images.length} for ${projectName}`}
                  style={{ cursor: "pointer", aspectRatio: IMAGE_ASPECT_RATIO.CAROUSEL }}
                >
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    className="object-cover select-none"
                    sizes={`(max-width: ${BREAKPOINTS.MOBILE}px) 90vw, ${BREAKPOINTS.MOBILE}px`}
                    preload={preloadImage}
                    fetchPriority={preloadImage ? "high" : undefined}
                    loading={preloadImage ? undefined : "lazy"}
                    draggable={false}
                  />
                </button>
              ) : (
                <div
                  data-carousel-image-index={index}
                  className="relative w-full overflow-hidden rounded-lg border-[3px] border-border shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.15),0px_4px_6px_-4px_rgba(0,0,0,0.12)] select-none dark:shadow-none"
                  style={{ aspectRatio: IMAGE_ASPECT_RATIO.CAROUSEL }}
                >
                  <Image
                    src={imageSrc}
                    alt={`${projectName}, image ${index + 1} of ${images.length}`}
                    fill
                    className="object-cover select-none"
                    sizes={`(max-width: ${BREAKPOINTS.MOBILE}px) 90vw, ${BREAKPOINTS.MOBILE}px`}
                    preload={preloadImage}
                    fetchPriority={preloadImage ? "high" : undefined}
                    loading={preloadImage ? undefined : "lazy"}
                    draggable={false}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        images={images}
        imageFolder={imageFolder}
        currentIndex={lightboxIndex}
        clickedImageRect={clickedImageRect}
        projectName={projectName}
        returnFocusRef={lightboxOpenerRef}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const DraggableCarousel = React.memo(DraggableCarouselComponent)
