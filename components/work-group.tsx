"use client"

import Image from "next/image"
import { useState } from "react"
import { DraggableCarousel } from "./draggable-carousel"
import { WorkGroup as WorkGroupType } from "@/lib/work-groups"

interface WorkGroupProps {
  workGroup: WorkGroupType
  showDivider?: boolean
}

export function WorkGroup({ workGroup, showDivider = true }: WorkGroupProps) {
  const [logoError, setLogoError] = useState(false)

  return (
    <>
      {showDivider && (
        <div className="flex h-[9px] items-center justify-center py-1">
          <div className="h-px w-full bg-border" />
        </div>
      )}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]">
            {!logoError && workGroup.logoPath ? (
              <Image
                src={workGroup.logoPath}
                alt={`${workGroup.company} logo`}
                fill
                className="object-contain p-1.5"
                sizes="44px"
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
              className="text-sm font-medium leading-none text-muted-foreground [&_span.underline]:underline [&_span.underline]:text-foreground"
              dangerouslySetInnerHTML={{ __html: workGroup.description }}
            />
          </div>
        </div>

        {/* Draggable Image Carousel */}
        {workGroup.images.length > 0 && (
          <DraggableCarousel
            images={workGroup.images}
            imageFolder={workGroup.imageFolder}
          />
        )}
      </div>
    </>
  )
}

