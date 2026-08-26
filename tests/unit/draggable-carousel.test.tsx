import { DraggableCarousel } from "@/components/draggable-carousel"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installResizeObserverMock } from "../helpers/browser-mocks"

const breakpoint = vi.hoisted(() => ({ matches: true }))

vi.mock("@/lib/hooks", () => ({
  useBreakpoint: () => breakpoint.matches,
}))
vi.mock("framer-motion", () => import("../helpers/framer-motion"))
vi.mock("next/image", () => import("../helpers/next-image"))

const images = ["one.jpg", "two.jpg", "three.jpg"]
const carouselProps = {
  images,
  imageFolder: "/images/project",
  projectName: "Project Alpha",
  preloadFirstImage: false,
}

function dispatchTouch(
  target: Element,
  type: "touchstart" | "touchmove" | "touchend" | "touchcancel",
  clientX?: number,
  clientY?: number,
  cancelable = true
) {
  const event = new Event(type, { bubbles: true, cancelable })
  const touches = clientX === undefined || clientY === undefined ? [] : [{ clientX, clientY }]
  Object.defineProperty(event, "touches", { value: touches })
  target.dispatchEvent(event)
  return event
}

describe("DraggableCarousel", () => {
  beforeEach(() => {
    breakpoint.matches = true
    installResizeObserverMock()
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
  })

  it("opens the clicked image exactly once at the selected index on desktop", () => {
    render(<DraggableCarousel {...carouselProps} />)
    const secondImage = document.querySelector('[data-carousel-image-index="1"]')
    expect(secondImage).not.toBeNull()

    fireEvent.click(secondImage!, { detail: 1 })
    fireEvent.click(secondImage!, { detail: 1 })

    expect(screen.getAllByTestId("image-lightbox")).toHaveLength(1)
    expect(screen.getByAltText("Project Alpha, image 2 of 3")).toBeInTheDocument()
  })

  it("exposes project-aware controls that open the selected image with Enter and Space", async () => {
    const user = userEvent.setup()
    render(<DraggableCarousel {...carouselProps} />)
    const controls = screen.getAllByRole("button", {
      name: /Open image \d of 3 for Project Alpha/,
    })

    expect(controls.map((control) => control.getAttribute("aria-label"))).toEqual([
      "Open image 1 of 3 for Project Alpha",
      "Open image 2 of 3 for Project Alpha",
      "Open image 3 of 3 for Project Alpha",
    ])

    controls[1].focus()
    await user.keyboard("{Enter}")
    expect(screen.getByAltText("Project Alpha, image 2 of 3")).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(controls[1]).toHaveFocus()

    controls[2].focus()
    await user.keyboard(" ")
    expect(screen.getByAltText("Project Alpha, image 3 of 3")).toBeInTheDocument()
  })

  it("does not open the lightbox below the desktop breakpoint", () => {
    breakpoint.matches = false
    render(<DraggableCarousel {...carouselProps} />)

    expect(screen.queryAllByRole("button", { name: /Open image/ })).toHaveLength(0)
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()
    fireEvent.click(document.querySelector('[data-carousel-image-index="0"]')!, { detail: 1 })

    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument()
  })

  it("gates clicks during a drag and allows them after the drag reset", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] })
    vi.setSystemTime(0)
    render(<DraggableCarousel {...carouselProps} />)
    const carousel = screen.getByTestId("carousel-track")
    const firstImage = document.querySelector('[data-carousel-image-index="0"]')!

    fireEvent.dragStart(carousel)
    vi.setSystemTime(150)
    fireEvent.dragEnd(carousel)
    fireEvent.click(firstImage, { detail: 1 })
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(firstImage, { detail: 1 })
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()
  })

  it("does not let a stale pointer-drag latch block keyboard activation", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] })
    vi.setSystemTime(0)
    render(<DraggableCarousel {...carouselProps} />)
    const carousel = screen.getByTestId("carousel-track")
    const firstImage = screen.getByRole("button", {
      name: "Open image 1 of 3 for Project Alpha",
    })

    fireEvent.dragStart(carousel)
    vi.setSystemTime(150)
    fireEvent.dragEnd(carousel)
    fireEvent.click(firstImage, { detail: 0 })

    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()
  })

  it("returns no interaction surface for an empty image list", () => {
    const { container } = render(
      <DraggableCarousel
        images={[]}
        imageFolder="/images/project"
        projectName="Project Alpha"
        preloadFirstImage={false}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("preloads only the first image when selected by the page", () => {
    breakpoint.matches = false
    render(<DraggableCarousel {...carouselProps} preloadFirstImage />)

    const renderedImages = screen.getAllByRole("img")
    expect(renderedImages[0]).toHaveAttribute("data-preload", "true")
    expect(renderedImages[0]).toHaveAttribute("fetchpriority", "high")
    expect(renderedImages[0]).not.toHaveAttribute("loading")
    for (const image of renderedImages.slice(1)) {
      expect(image).toHaveAttribute("loading", "lazy")
      expect(image).not.toHaveAttribute("data-preload")
      expect(image).not.toHaveAttribute("fetchpriority")
    }
  })

  it("permits native vertical panning on the horizontal drag surface", () => {
    render(<DraggableCarousel {...carouselProps} />)

    expect(screen.getByTestId("carousel-track")).toHaveStyle({
      overscrollBehaviorX: "contain",
      touchAction: "pan-y",
    })
  })

  it("only cancels touch movement after clear horizontal intent", () => {
    render(<DraggableCarousel {...carouselProps} />)
    const carousel = screen.getByTestId("carousel-track")

    dispatchTouch(carousel, "touchstart", 100, 100)
    expect(dispatchTouch(carousel, "touchmove", 104, 130).defaultPrevented).toBe(false)
    expect(dispatchTouch(carousel, "touchmove", 160, 130).defaultPrevented).toBe(false)
    dispatchTouch(carousel, "touchend")

    dispatchTouch(carousel, "touchstart", 100, 100)
    expect(dispatchTouch(carousel, "touchmove", 120, 120).defaultPrevented).toBe(false)
    expect(dispatchTouch(carousel, "touchmove", 140, 121).defaultPrevented).toBe(false)
    dispatchTouch(carousel, "touchend")

    dispatchTouch(carousel, "touchstart", 100, 100)
    expect(dispatchTouch(carousel, "touchmove", 108, 102).defaultPrevented).toBe(false)
    dispatchTouch(carousel, "touchend")

    dispatchTouch(carousel, "touchstart", 100, 100)
    expect(dispatchTouch(carousel, "touchmove", 120, 104).defaultPrevented).toBe(true)
    expect(dispatchTouch(carousel, "touchmove", 121, 150).defaultPrevented).toBe(true)
    dispatchTouch(carousel, "touchend")

    dispatchTouch(carousel, "touchstart", 100, 100)
    expect(dispatchTouch(carousel, "touchmove", 120, 104, false).defaultPrevented).toBe(false)
    expect(dispatchTouch(carousel, "touchmove", 121, 105).defaultPrevented).toBe(true)
  })

  it("intercepts a horizontal touch that starts at the viewport edge", () => {
    render(<DraggableCarousel {...carouselProps} />)
    const carousel = screen.getByTestId("carousel-track")

    dispatchTouch(carousel, "touchstart", 0, 0)

    expect(dispatchTouch(carousel, "touchmove", 20, 2).defaultPrevented).toBe(true)
  })
})
