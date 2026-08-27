"use client"

import type { DescriptionPart } from "@/lib/project-image-manifest"
import type { PortfolioProjectView } from "@/lib/portfolio-view-model"
import Image from "next/image"
import Link from "next/link"
import React, { useCallback, useState } from "react"
import { DraggableCarousel } from "./draggable-carousel"

interface WorkGroupProps {
  workGroup: PortfolioProjectView
  preloadFirstImage: boolean
}

function WorkGroupComponent({ preloadFirstImage, workGroup }: WorkGroupProps) {
  const [logoError, setLogoError] = useState(false)

  const handleLogoError = useCallback(() => setLogoError(true), [])

  return (
    <div className="flex flex-col gap-4" data-work-group-id={workGroup.id}>
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[1.5px] border-border bg-accent shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] dark:shadow-none">
            {!logoError && workGroup.logoSrc ? (
              <Image
                src={workGroup.logoSrc}
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
            <ProjectDescription parts={workGroup.description} />
          </div>
        </div>

        {/* Draggable Image Carousel */}
        <DraggableCarousel
          images={workGroup.gallery}
          projectName={workGroup.name}
          preloadFirstImage={preloadFirstImage}
        />
      </div>
  )
}

function ProjectDescription({ parts }: { parts: readonly DescriptionPart[] }) {
  return (
    <p className="text-sm font-normal leading-none text-muted-foreground">
      {parts.map((part, index) =>
        part.type === "link" ? (
          <Link
            key={`${part.href}-${index}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-1 underline-offset-2 transition-colors hover:text-foreground motion-reduce:transition-none"
          >
            {part.text}
          </Link>
        ) : (
          <React.Fragment key={`text-${index}`}>{part.text}</React.Fragment>
        )
      )}
    </p>
  )
}

// Memoize component to prevent unnecessary re-renders
export const WorkGroup = React.memo(WorkGroupComponent)
