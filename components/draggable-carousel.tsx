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
    <div className="w-full overflow-hidden">
      <motion.div
        ref={carouselRef}
        className="flex cursor-grab gap-6 active:cursor-grabbing"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        style={{ x }}
        whileDrag={{ cursor: "grabbing" }}
      >
        {images.map((image, index) => (
          <motion.div
            key={index}
            className="flex shrink-0 flex-col overflow-hidden rounded-3xl border border-border p-6"
            style={{ width: 'min(100vw - 48px, 572px)' }}
          >
            <div className="relative aspect-[348/196] w-full overflow-hidden rounded-lg border-[3px] border-[rgba(241,239,238,0.2)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
              <Image
                src={`${imageFolder}/${image}`}
                alt={`Carousel image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) calc(100vw - 48px), 572px"
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

