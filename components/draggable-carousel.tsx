"use client"

import { motion, useMotionValue } from "framer-motion"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"

interface DraggableCarouselProps {
  images: string[]
  imageFolder: string
}

export function DraggableCarousel({ images, imageFolder }: DraggableCarouselProps) {
  const [width, setWidth] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [images])

  const dragConstraints = width > 0 ? { left: -width, right: 0 } : undefined

  // If no images, show placeholder
  if (images.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-visible">
      <motion.div
        ref={carouselRef}
        className="flex cursor-grab gap-6 active:cursor-grabbing select-none"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        style={{ x }}
        whileDrag={{ cursor: "grabbing" }}
        onDragStart={(e) => {
          e.preventDefault()
        }}
      >
        {images.map((image, index) => {
          // If image path starts with "/", it's a full path, otherwise use imageFolder
          const imageSrc = image.startsWith("/") ? image : `${imageFolder}/${image}`
          return (
            <motion.div
              key={index}
              className="flex shrink-0 flex-col overflow-hidden rounded-3xl border border-border p-6 select-none"
              style={{ width: 'min(100vw - 48px, 572px)' }}
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
                  fill
                  className="object-cover select-none"
                  sizes="(max-width: 768px) calc(100vw - 48px), 572px"
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

