"use client"

import { calculateTransformOrigin } from "@/lib/image-lightbox-utils"
import type { GalleryImage } from "@/lib/portfolio-view-model"
import { useReducedMotion } from "framer-motion"
import Image, { getImageProps } from "next/image"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react"
import { preload } from "react-dom"

interface ImageLightboxProps {
  isOpen: boolean
  images: readonly GalleryImage[]
  currentIndex: number
  clickedImageRect: DOMRect | null
  projectName: string
  returnFocusRef: RefObject<HTMLElement | null>
  onClose: () => void
  onNavigate: (index: number) => void
}

const LIGHTBOX_IMAGE_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
const LIGHTBOX_EXIT_MS = 176

type LightboxImageState = "loading" | "loaded" | "error"

export function getLightboxPreloadIndices(imageCount: number, currentIndex: number) {
  if (imageCount <= 0 || currentIndex < 0 || currentIndex >= imageCount) return []
  return Array.from(
    new Set([
      currentIndex,
      (currentIndex + 1) % imageCount,
      (currentIndex - 1 + imageCount) % imageCount,
    ])
  )
}

export function preloadLightboxImages(
  images: readonly GalleryImage[],
  currentIndex: number
) {
  getLightboxPreloadIndices(images.length, currentIndex).forEach((index) => {
    const image = images[index]
    if (!image) return

    const { props } = getImageProps({
      src: image.src,
      alt: "",
      fill: true,
      sizes: LIGHTBOX_IMAGE_SIZES,
      quality: 95,
    })
    preload(props.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
    })
  })
}

function LightboxImageFrame({
  image,
  imageCount,
  imageIndex,
  projectName,
}: {
  image: GalleryImage
  imageCount: number
  imageIndex: number
  projectName: string
}) {
  const [imageState, setImageState] = useState<LightboxImageState>("loading")
  const description = `${projectName}, image ${imageIndex + 1} of ${imageCount}`

  const handleLoad = useCallback(() => {
    setImageState((state) => (state === "loading" ? "loaded" : state))
  }, [])
  const handleError = useCallback(() => {
    setImageState((state) => (state === "loading" ? "error" : state))
  }, [])

  return (
    <div
      data-testid="lightbox-image-frame"
      data-image-state={imageState}
      className="relative w-[min(75vw,calc((100vh-92px)*348/196))] max-w-[1200px]"
      style={{ aspectRatio: "348 / 196", maxHeight: "calc(100vh - 92px)" }}
    >
      {image.blurDataURL && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
            imageState === "loading" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${image.blurDataURL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "blur(20px)",
            transform: "scale(1.1)",
          }}
        />
      )}
      <Image
        src={image.src}
        alt={description}
        aria-hidden={imageState === "error" ? true : undefined}
        fill
        className={`scale-[1.005] object-contain transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          imageState === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        sizes={LIGHTBOX_IMAGE_SIZES}
        quality={95}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        placeholder={image.blurDataURL ? "blur" : undefined}
        blurDataURL={image.blurDataURL ?? undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
      {imageState === "error" && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="absolute inset-0 flex items-center justify-center bg-background px-8 text-center text-sm font-medium leading-normal text-foreground"
        >
          Could not load image {imageIndex + 1} of {imageCount} for {projectName}.
        </p>
      )}
    </div>
  )
}

export function ImageLightbox({
  isOpen,
  images,
  currentIndex,
  clickedImageRect,
  projectName,
  returnFocusRef,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const closingRef = useRef(false)
  const titleId = useId()
  const prefersReducedMotion = useReducedMotion() ?? false
  const [closing, setClosing] = useState(false)
  const active = isOpen || closing

  const transformOrigin = useMemo(
    () => calculateTransformOrigin(clickedImageRect, prefersReducedMotion),
    [clickedImageRect, prefersReducedMotion]
  )
  const currentImage = images[currentIndex]
  const canNavigate = images.length > 1

  const handlePrevious = useCallback(() => {
    if (canNavigate) onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
  }, [canNavigate, currentIndex, images.length, onNavigate])
  const handleNext = useCallback(() => {
    if (canNavigate) onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
  }, [canNavigate, currentIndex, images.length, onNavigate])

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
    closingRef.current = false
    onClose()
    setClosing(false)
  }, [onClose])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (prefersReducedMotion) {
      finishClose()
      return
    }
    setClosing(true)
    closeTimerRef.current = window.setTimeout(finishClose, LIGHTBOX_EXIT_MS)
  }, [finishClose, prefersReducedMotion])

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.shiftKey && event.key !== "Tab")
      ) return

      if (event.key === "Tab") {
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []
        )
        const current = controls.indexOf(document.activeElement as HTMLElement)
        const next = event.shiftKey
          ? current <= 0
            ? controls.length - 1
            : current - 1
          : current < 0 || current === controls.length - 1
            ? 0
            : current + 1
        if (controls[next]) {
          event.preventDefault()
          controls[next].focus({ preventScroll: true })
        }
      } else if (event.key === "Escape") {
        event.preventDefault()
        requestClose()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        handlePrevious()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        handleNext()
      } else if (event.key === "Home") {
        event.preventDefault()
        if (images.length > 0) onNavigate(0)
      } else if (event.key === "End") {
        event.preventDefault()
        if (images.length > 0) onNavigate(images.length - 1)
      }
    },
    [handleNext, handlePrevious, images.length, onNavigate, requestClose]
  )

  useEffect(() => {
    if (!active) return
    const dialog = dialogRef.current
    const opener = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal()
      else dialog.setAttribute("open", "")
    }
    closeButtonRef.current?.focus({ preventScroll: true })

    return () => {
      if (dialog?.open && typeof dialog.close === "function") dialog.close()
      else dialog?.removeAttribute("open")
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [active, returnFocusRef])

  useEffect(() => {
    if (isOpen && !closing) closingRef.current = false
    if (!isOpen && !closing && closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [closing, isOpen])

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
  }, [])

  useEffect(() => {
    if (isOpen) preloadLightboxImages(images, currentIndex)
  }, [currentIndex, images, isOpen])

  if (!active || !currentImage) return null

  return (
    <dialog
      ref={dialogRef}
      data-testid="image-lightbox"
      data-state={closing ? "closing" : "open"}
      aria-labelledby={titleId}
      aria-modal="true"
      className="lightbox-dialog fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none border-0 bg-transparent p-4"
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <h2 id={titleId} className="sr-only">
        Image viewer for {projectName}
      </h2>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Image {currentIndex + 1} of {images.length} for {projectName}
      </p>

      <div
        className="lightbox-panel group relative flex h-full items-center justify-center"
        style={{ transformOrigin }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={requestClose}
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-background active:scale-95 md:right-[calc(12.5vw-3.5rem)] md:top-[calc(50%-min(37.5vw,(100vh-92px)*348/392))] motion-reduce:transition-none"
          aria-label="Close image viewer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative flex items-center justify-center overflow-hidden rounded-lg border-[3px] border-border p-0 shadow-2xl">
          <LightboxImageFrame
            key={currentImage.src}
            image={currentImage}
            imageCount={images.length}
            imageIndex={currentIndex}
            projectName={projectName}
          />
        </div>

        {canNavigate && (
          <button
            type="button"
            onClick={handlePrevious}
            className="lightbox-nav absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-background active:scale-95 md:left-[calc(12.5vw-3.5rem)]"
            aria-label="Previous image"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {canNavigate && (
          <div
            role="group"
            aria-label="Choose image"
            className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1"
          >
            {images.map((image, index) => {
              const activeDot = index === currentIndex
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onNavigate(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label={`Go to image ${index + 1}`}
                  aria-current={activeDot ? "true" : undefined}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full border ${
                      activeDot
                        ? "scale-x-[2.4] border-foreground bg-foreground"
                        : "border-border bg-background/70"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        )}

        {canNavigate && (
          <button
            type="button"
            onClick={handleNext}
            className="lightbox-nav absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-background active:scale-95 md:right-[calc(12.5vw-3.5rem)]"
            aria-label="Next image"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </dialog>
  )
}
