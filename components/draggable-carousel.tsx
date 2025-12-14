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

  // Handle wheel/trackpad scrolling
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleWheel = (e: WheelEvent) => {
      if (isDragging.current) return
      
      // Check if horizontal scroll (deltaX) or trackpad horizontal gesture
      if (Math.abs(e.deltaX) > 0 || (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) === 0 && e.shiftKey)) {
        e.preventDefault()
        const delta = e.deltaX !== 0 ? e.deltaX : (e.deltaY * -1) // Shift+scroll converts to horizontal
        const currentX = x.get()
        const newX = Math.max(-width, Math.min(0, currentX - delta))
        x.set(newX)
      }
    }

    carousel.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      carousel.removeEventListener("wheel", handleWheel)
    }
  }, [x, width])

  const dragConstraints = width > 0 ? { left: -width, right: 0 } : undefined

  // If no images, show placeholder
  if (images.length === 0) {
    return null
  }

  return (
    <div ref={wrapperRef} className="w-full overflow-visible">
      <motion.div
        ref={carouselRef}
        className="flex cursor-grab gap-3 sm:gap-6 active:cursor-grabbing select-none"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        style={{ x }}
        whileDrag={{ cursor: "grabbing" }}
        onDragStart={() => {
          isDragging.current = true
        }}
        onDragEnd={() => {
          isDragging.current = false
        }}
      >
        {images.map((image, index) => {
          // If image path starts with "/", it's a full path, otherwise use imageFolder
          const imageSrc = image.startsWith("/") ? image : `${imageFolder}/${image}`
          return (
            <motion.div
              key={index}
              className="flex shrink-0 flex-col overflow-visible sm:overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border sm:border-border p-0 sm:p-6 h-fit select-none"
              style={{ width: cardWidth > 0 ? `${cardWidth}px` : '100%' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.69, 
                ease: [0.25, 0.1, 0.25, 1],
                delay: index * 0.0897
              }}
              onDragStart={(e) => {
                e.preventDefault()
              }}
            >
              <div 
                className="relative aspect-[348/196] w-full overflow-hidden rounded-lg border-[3px] border-[rgba(241,239,238,0.2)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] select-none"
                onDragStart={(e) => {
                  e.preventDefault()
                }}
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
      </motion.div>
    </div>
  )
}

