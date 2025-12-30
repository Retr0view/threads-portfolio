"use client"

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { motion, useMotionValue, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { ImageLightbox } from "./image-lightbox"
import { useBreakpoint } from "@/lib/hooks"
import { BREAKPOINTS, ANIMATION, EASING, IMAGE_ASPECT_RATIO, PRELOAD } from "@/lib/constants"
import { normalizeImagePath } from "@/lib/image-utils"

interface DraggableCarouselProps {
  images: string[]
  imageFolder: string
}

function DraggableCarouselComponent({ images, imageFolder }: DraggableCarouselProps) {
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
  const preloadLinksRef = useRef<HTMLLinkElement[]>([])
  const preloadTimeoutsRef = useRef<NodeJS.Timeout[]>([])

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

    let touchStartX = 0
    let touchStartY = 0
    let isHorizontalSwipe = false

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      isHorizontalSwipe = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return
      
      const touchCurrentX = e.touches[0].clientX
      const touchCurrentY = e.touches[0].clientY
      const diffX = Math.abs(touchCurrentX - touchStartX)
      const diffY = Math.abs(touchCurrentY - touchStartY)

      // Determine if this is a horizontal swipe
      if (diffX > diffY && diffX > 10) {
        isHorizontalSwipe = true
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      touchStartX = 0
      touchStartY = 0
      isHorizontalSwipe = false
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

    // Prevent Safari gesture navigation
    const handleGestureStart = (e: Event) => {
      e.preventDefault()
    }

    interaction.addEventListener("touchstart", handleTouchStart, { passive: false })
    interaction.addEventListener("touchmove", handleTouchMove, { passive: false })
    interaction.addEventListener("touchend", handleTouchEnd)
    interaction.addEventListener("wheel", handleWheelPrevent, { passive: false })
    interaction.addEventListener("gesturestart", handleGestureStart)
    interaction.addEventListener("gesturechange", handleGestureStart)
    interaction.addEventListener("gestureend", handleGestureStart)

    return () => {
      interaction.removeEventListener("touchstart", handleTouchStart)
      interaction.removeEventListener("touchmove", handleTouchMove)
      interaction.removeEventListener("touchend", handleTouchEnd)
      interaction.removeEventListener("wheel", handleWheelPrevent)
      interaction.removeEventListener("gesturestart", handleGestureStart)
      interaction.removeEventListener("gesturechange", handleGestureStart)
      interaction.removeEventListener("gestureend", handleGestureStart)
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

  // Preload lightbox image for instant loading
  const preloadLightboxImage = useCallback((imagePath: string) => {
    if (typeof window === "undefined") return
    
    // Use link rel=preload for high priority
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = imagePath
    link.setAttribute("fetchpriority", "high")
    document.head.appendChild(link)
    preloadLinksRef.current.push(link)
    
    // Also preload using Image object for browser cache
    const img = new window.Image()
    img.src = imagePath
    
    // Clean up link after a delay (image should be cached by then)
    const timeout = setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
        preloadLinksRef.current = preloadLinksRef.current.filter((l) => l !== link)
      }
        }, PRELOAD.LIGHTBOX_IMAGE_TIMEOUT)
    preloadTimeoutsRef.current.push(timeout)
  }, [])

  // Preload all lightbox images after initial page load (low priority)
  useEffect(() => {
    if (typeof window === "undefined") return

    let loadHandler: (() => void) | null = null
    let idleCallbackId: number | null = null
    let fallbackTimeout: NodeJS.Timeout | null = null

    // Use requestIdleCallback to defer preloading until browser is idle
    // This ensures it doesn't interfere with initial page rendering
    const preloadAllImages = () => {
      images.forEach((image) => {
        const imagePath = normalizeImagePath(image, imageFolder)
        
        // Use low priority preload so it doesn't compete with initial page load
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = imagePath
        link.setAttribute("fetchpriority", "low")
        document.head.appendChild(link)
        preloadLinksRef.current.push(link)
        
        // Also preload using Image object for browser cache
        const img = new window.Image()
        img.src = imagePath
        
        // Clean up link after a delay (image should be cached by then)
        const timeout = setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link)
            preloadLinksRef.current = preloadLinksRef.current.filter((l) => l !== link)
          }
        }, PRELOAD.ALL_IMAGES_TIMEOUT)
        preloadTimeoutsRef.current.push(timeout)
      })
    }

    // Wait for page to be interactive, then use idle callback if available
    if (document.readyState === "complete") {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(preloadAllImages, { timeout: PRELOAD.IDLE_CALLBACK_TIMEOUT }) as unknown as number
      } else {
        // Fallback: wait a bit then preload
        fallbackTimeout = setTimeout(preloadAllImages, PRELOAD.FALLBACK_DELAY)
      }
    } else {
      loadHandler = () => {
        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(preloadAllImages, { timeout: PRELOAD.IDLE_CALLBACK_TIMEOUT }) as unknown as number
        } else {
          fallbackTimeout = setTimeout(preloadAllImages, PRELOAD.FALLBACK_DELAY)
        }
      }
      window.addEventListener("load", loadHandler)
    }

    // Cleanup function
    return () => {
      // Remove event listener if it was added
      if (loadHandler) {
        window.removeEventListener("load", loadHandler)
      }
      
      // Cancel idle callback if it exists
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId)
      }
      
      // Clear fallback timeout
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout)
      }
      
      // Clean up all preload links
      preloadLinksRef.current.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
      preloadLinksRef.current = []
      
      // Clear all timeouts
      preloadTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      preloadTimeoutsRef.current = []
    }
  }, [images, imageFolder])

  // Memoize click handler with preloading
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    // Only open lightbox on desktop and if not dragging
    if (isDesktop && !isDragging.current) {
      const image = images[index]
      const imagePath = image.startsWith("/") ? image : `${imageFolder}/${image}`
      
      // Preload the image BEFORE opening lightbox
      preloadLightboxImage(imagePath)
      
      const rect = e.currentTarget.getBoundingClientRect()
      setClickedImageRect(rect)
      setLightboxIndex(index)
      
      // Small delay to allow preload to start, then open lightbox
      requestAnimationFrame(() => {
        setLightboxOpen(true)
      })
    }
  }, [isDesktop, images, imageFolder, preloadLightboxImage])

  // Memoize hover handlers
  const handleMouseEnter = useCallback(() => setIsHovering(true), [])
  const handleMouseLeave = useCallback(() => setIsHovering(false), [])

  // Memoize pointer down handler
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ensure pointer events are captured even in gap areas
    e.stopPropagation()
  }, [])

  // Memoize lightbox handlers
  const handleLightboxClose = useCallback(() => setLightboxOpen(false), [])
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
        className="flex gap-3 xs:gap-6 cursor-grab active:cursor-grabbing w-fit select-none"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={ANIMATION.CAROUSEL_DRAG_ELASTIC}
        dragPropagation={false}
        dragTransition={{ bounceStiffness: ANIMATION.CAROUSEL_DRAG_BOUNCE_STIFFNESS, bounceDamping: ANIMATION.CAROUSEL_DRAG_BOUNCE_DAMPING }}
        style={{ x, touchAction: "pan-x", overscrollBehaviorX: "contain", pointerEvents: "auto", backgroundColor: "transparent" }}
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
              <div 
                className="relative w-full overflow-hidden rounded-lg border-[3px] border-border shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.15),0px_4px_6px_-4px_rgba(0,0,0,0.12)] dark:shadow-none select-none"
                onClick={(e) => handleImageClick(e, index)}
                onMouseEnter={() => {
                  // Preload on hover for smoother experience
                  if (isDesktop) {
                    const imagePath = imageSrc
                    preloadLightboxImage(imagePath)
                  }
                }}
                style={{
                  cursor: isDesktop ? "pointer" : "default",
                  aspectRatio: IMAGE_ASPECT_RATIO.CAROUSEL,
                }}
              >
                <Image
                  src={imageSrc}
                  alt={`Carousel image ${index + 1}`}
                  fill
                  className="object-cover select-none"
                  sizes={`(max-width: ${BREAKPOINTS.MOBILE}px) 90vw, ${BREAKPOINTS.MOBILE}px`}
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </div>
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
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const DraggableCarousel = React.memo(DraggableCarouselComponent)
