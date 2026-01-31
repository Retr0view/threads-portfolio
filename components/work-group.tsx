"use client"

import { WorkGroup as WorkGroupType } from "@/lib/work-groups"
import Image from "next/image"
import React, { useCallback, useState } from "react"
import { DraggableCarousel } from "./draggable-carousel"

interface WorkGroupProps {
  workGroup: WorkGroupType
}

function WorkGroupComponent({ workGroup }: WorkGroupProps) {
  const [logoError, setLogoError] = useState(false)

  const handleLogoError = useCallback(() => setLogoError(true), [])

  // Memoize images array to prevent unnecessary re-renders of DraggableCarousel
  const carouselImages = React.useMemo(
    () => workGroup.images.length > 0 ? workGroup.images : Array(3).fill(workGroup.placeholderImage),
    [workGroup.images, workGroup.placeholderImage]
  )

  return (
    <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] dark:shadow-none">
            {!logoError && workGroup.logoPath ? (
              <Image
                src={workGroup.logoPath}
                alt={`${workGroup.company} logo`}
                width={44}
                height={44}
                className="object-cover w-full h-full"
                onError={handleLogoError}
                sizes="44px"
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
              className="text-sm font-normal leading-none text-muted-foreground [&_a.underline]:underline [&_a.underline]:text-muted-foreground [&_a.underline]:transition-colors [&_a.underline:hover]:text-foreground"
              dangerouslySetInnerHTML={{ __html: workGroup.description }}
            />
          </div>
        </div>

        {/* Draggable Image Carousel */}
        <DraggableCarousel
          images={carouselImages}
          imageFolder={workGroup.imageFolder}
          projectName={workGroup.name}
        />
      </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const WorkGroup = React.memo(WorkGroupComponent)