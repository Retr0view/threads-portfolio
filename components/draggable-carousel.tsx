"use client"

import { motion, useMotionValue } from "framer-motion"
import { Image } from "@unpic/react/nextjs"
import { useRef, useState, useEffect } from "react"

interface DraggableCarouselProps {
  images: string[]
  imageFolder: string
}

export function DraggableCarousel({ images, imageFolder }: DraggableCarouselProps) {
  const [width, setWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const isDragging = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHorizontalScroll = useRef(false)

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current && wrapperRef.current) {
        const carouselWidth = carouselRef.current.scrollWidth
        const wrapperWidth = wrapperRef.current.offsetWidth
        setWidth(Math.max(0, carouselWidth - wrapperWidth))
      }
      if (wrapperRef.current) {
        setCardWidth(wrapperRef.current.offsetWidth)
      }
    }
    
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    updateWidth()
    checkDesktop()
    window.addEventListener("resize", updateWidth)
    window.addEventListener("resize", checkDesktop)
    return () => {
      window.removeEventListener("resize", updateWidth)
      window.removeEventListener("resize", checkDesktop)
    }
  }, [images])

  // Prevent browser navigation on horizontal swipe/scroll
  useEffect(() => {
    if (!wrapperRef.current) return

    const element = wrapperRef.current

    const handleTouchStart = (e: TouchEvent) => {
      // Check if touch started within the carousel wrapper (including gaps)
      if (element.contains(e.target as Node)) {
        const touch = e.touches[0]
        touchStartX.current = touch.clientX
        touchStartY.current = touch.clientY
        isHorizontalScroll.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      
      // Check if we're still within the carousel area (including gaps)
      // Use getBoundingClientRect to check if touch is within element bounds
      const rect = element.getBoundingClientRect()
      const touch = e.touches[0]
      const isWithinBounds = 
        touch.clientX >= rect.left && 
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top && 
        touch.clientY <= rect.bottom

      // If we started in the carousel and are dragging, continue preventing navigation
      // even if we're slightly outside bounds (allows for gaps and edge cases)
      if (!isWithinBounds && !isHorizontalScroll.current && !isDragging.current) return

      const deltaX = Math.abs(touch.clientX - touchStartX.current)
      const deltaY = Math.abs(touch.clientY - touchStartY.current)
      
      // If horizontal movement is greater than vertical, prevent browser navigation
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalScroll.current = true
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
      touchStartY.current = null
      isHorizontalScroll.current = false
    }

    // Prevent browser swipe navigation on Mac trackpad
    // This works even when pointer is in gaps because we check element bounds
    // Note: The React onWheel handler will handle the actual scrolling,
    // this just prevents browser navigation gestures
    const handleWheel = (e: WheelEvent) => {
      // Check if wheel event is within carousel bounds (including gaps)
      const rect = element.getBoundingClientRect()
      const isWithinBounds = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right &&
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      
      if (!isWithinBounds) return
      
      // If horizontal scroll detected, prevent browser navigation
      // The React handler will also preventDefault for actual scrolling,
      // but this ensures browser gestures are blocked even in gaps
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0) {
        e.preventDefault()
      }
    }

    // Add listeners to prevent browser swipe navigation
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('wheel', handleWheel)
    }
  }, [])

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
    <motion.div
      ref={wrapperRef}
      className="w-full cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragPropagation={false}
      style={{ x, touchAction: "pan-x pan-y pinch-zoom" }}
      whileDrag={{ cursor: "grabbing" }}
      onWheel={handleWheel}
      onDragStart={() => {
        isDragging.current = true
      }}
      onDragEnd={() => {
        isDragging.current = false
      }}
    >
      <div
        ref={carouselRef}
        className="flex gap-3 sm:gap-6 select-none w-full"
      >
        {images.map((image, index) => {
          // If image path starts with "/", it's a full path, otherwise use imageFolder
          const imageSrc = image.startsWith("/") ? image : `${imageFolder}/${image}`
          return (
            <motion.div
              key={index}
              className="flex shrink-0 flex-col overflow-visible sm:overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border sm:border-border p-0 sm:p-6 h-fit select-none"
              style={{ 
                width: cardWidth > 0 ? `${cardWidth}px` : '100%'
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.69, 
                ease: [0.25, 0.1, 0.25, 1],
                delay: index * 0.0897
              }}
              onPointerDownCapture={(e) => {
                // Don't stop propagation - allow parent wrapper to handle drag
                // This ensures drag continues even when pointer moves into gaps
              }}
            >
              <div 
                className="relative aspect-[348/196] w-full overflow-hidden rounded-lg border-[3px] border-[rgba(241,239,238,0.2)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] select-none"
              >
                <Image
                  src={imageSrc}
                  alt={`Carousel image ${index + 1}`}
                  layout="fullWidth"
                  aspectRatio={348 / 196}
                  className="object-cover select-none"
                  breakpoints={isDesktop ? undefined : [640, 750, 828, 1080, 1240, 1920]}
                  {...(isDesktop && { unoptimized: true })}
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

