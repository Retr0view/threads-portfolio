"use client"

import { Image } from "@unpic/react/nextjs"
import { useState, useEffect } from "react"
import { DraggableCarousel } from "./draggable-carousel"
import { WorkGroup as WorkGroupType } from "@/lib/work-groups"

interface WorkGroupProps {
  workGroup: WorkGroupType
}

export function WorkGroup({ workGroup }: WorkGroupProps) {
  const [logoError, setLogoError] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  return (
    <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]">
            {!logoError && workGroup.logoPath ? (
              <Image
                src={workGroup.logoPath}
                alt={`${workGroup.company} logo`}
                width={44}
                height={44}
                className="object-cover w-full h-full"
                {...(isDesktop && { unoptimized: true })}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-foreground">
                {workGroup.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-medium leading-none tracking-[-0.16px] text-foreground">
              {workGroup.name}
            </p>
            <p 
              className="text-sm font-medium leading-none text-muted-foreground [&_a.underline]:underline [&_a.underline]:text-muted-foreground [&_a.underline]:transition-colors [&_a.underline:hover]:text-foreground"
              dangerouslySetInnerHTML={{ __html: workGroup.description }}
            />
          </div>
        </div>

        {/* Draggable Image Carousel */}
        <DraggableCarousel
          images={workGroup.images.length > 0 ? workGroup.images : Array(3).fill(workGroup.placeholderImage)}
          imageFolder={workGroup.imageFolder}
        />
      </div>
  )
}

