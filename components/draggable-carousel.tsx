"use client"

import { motion, useMotionValue, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { ImageLightbox } from "./image-lightbox"

// Constants
const MOBILE_BREAKPOINT = 620
const MOBILE_CARD_WIDTH_RATIO = 0.9
const ANIMATION_DURATION = 0.3
const STAGGER_DELAY = 0.05
const DRAG_BOUNCE_STIFFNESS = 600
const DRAG_BOUNCE_DAMPING = 30

interface DraggableCarouselProps {
  images: string[]
  imageFolder: string
}

export function DraggableCarousel({ images, imageFolder }: DraggableCarouselProps) {
  const [width, setWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
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

  // Update card width and desktop state based on viewport
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT
        const baseWidth = wrapperRef.current.offsetWidth
        setCardWidth(isMobile ? baseWidth * MOBILE_CARD_WIDTH_RATIO : baseWidth)
        setIsDesktop(window.innerWidth >= MOBILE_BREAKPOINT)
      }
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [images])

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

    // Also update on window resize
    window.addEventListener("resize", updateWidth)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateWidth)
    }
  }, [images])

  // Preload all images so lightbox opens without loading delays
  useEffect(() => {
    if (typeof window === "undefined") return

    const urls = new Set(
      images.map((image) =>
        image.startsWith("/") ? image : `${imageFolder}/${image}`,
      ),
    )

    urls.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [images, imageFolder])

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
  const handleWheel = (e: React.WheelEvent) => {
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
  }

  const dragConstraints = width > 0 ? { left: -width, right: 0 } : undefined

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
        dragElastic={0.1}
        dragPropagation={false}
        dragTransition={{ bounceStiffness: DRAG_BOUNCE_STIFFNESS, bounceDamping: DRAG_BOUNCE_DAMPING }}
        style={{ x, touchAction: "pan-x", overscrollBehaviorX: "contain", pointerEvents: "auto", backgroundColor: "transparent" }}
        whileDrag={{ cursor: "grabbing" }}
        onWheel={handleWheel}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDragStart={() => {
          isDragging.current = true
          dragStartTime.current = Date.now()
          dragStartX.current = x.get()
        }}
        onDragEnd={() => {
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
        }}
        onPointerDown={(e) => {
          // Ensure pointer events are captured even in gap areas
          e.stopPropagation()
        }}
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
                duration: ANIMATION_DURATION, 
                ease: [0.25, 0.1, 0.25, 1],
                delay: index * STAGGER_DELAY
              }}
              drag={false}
            >
              <div 
                className="relative aspect-[348/196] w-full overflow-hidden rounded-lg border-[3px] border-border shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.15),0px_4px_6px_-4px_rgba(0,0,0,0.12)] dark:shadow-none select-none"
                onClick={(e) => {
                  // Only open lightbox on desktop and if not dragging
                  if (isDesktop && !isDragging.current) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setClickedImageRect(rect)
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }
                }}
                style={{
                  cursor: isDesktop ? "pointer" : "default",
                }}
              >
                <Image
                  src={imageSrc}
                  alt={`Carousel image ${index + 1}`}
                  fill
                  className="object-cover select-none"
                  sizes="(max-width: 620px) 90vw, 620px"
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
        onClose={() => setLightboxOpen(false)}
        onNavigate={(index) => setLightboxIndex(index)}
      />
    </div>
  )
}

