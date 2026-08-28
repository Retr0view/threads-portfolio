import { getLightboxPreloadIndices, ImageLightbox, preloadLightboxImages } from "@/components/image-lightbox"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRef, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const resourceHints = vi.hoisted(() => ({ preload: vi.fn() }))

vi.mock("framer-motion", () => import("../helpers/framer-motion"))
vi.mock("next/image", () => import("../helpers/next-image"))
vi.mock("react-dom", async () => ({
  ...(await vi.importActual<typeof import("react-dom")>("react-dom")),
  preload: resourceHints.preload,
}))

const galleryImages = (names: string[]) =>
  names.map((name, index) => ({
    id: `image-${index + 1}`,
    src: `/images/project/${name}`,
    blurDataURL: null,
  }))

const images = galleryImages(["one.jpg", "two.jpg", "three.jpg"])

function StatefulLightbox() {
  const [isOpen, setIsOpen] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const openerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={openerRef} type="button">
        Open viewer
      </button>
      <ImageLightbox
        isOpen={isOpen}
        images={images}
        currentIndex={currentIndex}
        clickedImageRect={null}
        projectName="Project Alpha"
        returnFocusRef={openerRef}
        onClose={() => setIsOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </>
  )
}

function ToggleLightbox({ collection = images }: { collection?: ReturnType<typeof galleryImages> }) {
  const [isOpen, setIsOpen] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={openerRef} type="button" onClick={() => setIsOpen(true)}>
        Open viewer
      </button>
      <button type="button">Page behind</button>
      <ImageLightbox
        isOpen={isOpen}
        images={collection}
        currentIndex={0}
        clickedImageRect={null}
        projectName="Project Alpha"
        returnFocusRef={openerRef}
        onClose={() => setIsOpen(false)}
        onNavigate={vi.fn()}
      />
    </>
  )
}

describe("ImageLightbox", () => {
  beforeEach(() => {
    document.body.style.overflow = ""
    resourceHints.preload.mockClear()
  })

  it.each([
    { images: galleryImages([]), currentIndex: 0, expectedIndices: [] },
    { images: galleryImages(["one.jpg"]), currentIndex: 0, expectedIndices: [0] },
    {
      images: galleryImages(["one.jpg", "two.jpg"]),
      currentIndex: 1,
      expectedIndices: [1, 0],
    },
    { images, currentIndex: 1, expectedIndices: [1, 2, 0] },
  ])(
    "deduplicates optimizer requests for $images.length image collections",
    ({ images: collection, currentIndex, expectedIndices }) => {
      expect(getLightboxPreloadIndices(collection.length, currentIndex)).toEqual(expectedIndices)

      preloadLightboxImages(collection, currentIndex)

      expect(resourceHints.preload).toHaveBeenCalledTimes(expectedIndices.length)
      expect(resourceHints.preload.mock.calls.map(([requestUrl]) => requestUrl)).toEqual(
        expectedIndices.map(
          (index) => `/_next/image?url=${encodeURIComponent(collection[index]!.src)}&w=1200&q=95`
        )
      )
      resourceHints.preload.mock.calls.forEach(([, options]) => {
        expect(options).toMatchObject({
          as: "image",
          fetchPriority: "high",
          imageSizes: "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px",
        })
      })
    }
  )

  it("navigates with ArrowLeft, ArrowRight, Home, and End", () => {
    render(<StatefulLightbox />)
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()

    const dialog = screen.getByRole("dialog")
    expect(fireEvent.keyDown(dialog, { key: "ArrowLeft" })).toBe(false)
    expect(screen.getByAltText("Project Alpha, image 3 of 3")).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: "ArrowRight" })
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: "End" })
    expect(screen.getByAltText("Project Alpha, image 3 of 3")).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: "Home" })
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()

    expect(fireEvent.keyDown(dialog, { key: "ArrowRight", altKey: true })).toBe(true)
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()
  })

  it("exposes named modal semantics and initially focuses its visible close control", () => {
    render(<StatefulLightbox />)
    const dialog = screen.getByRole("dialog", {
      name: "Image viewer for Project Alpha",
    })

    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(screen.getByRole("button", { name: "Close image viewer" })).toHaveFocus()
    expect(screen.getByRole("group", { name: "Choose image" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Image 1 of 3 for Project Alpha")
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite")
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true")
    expect(screen.getByRole("button", { name: "Go to image 1" })).toHaveAttribute("aria-current", "true")
  })

  it("keeps focus in Close, Previous, dots, and Next order in both directions", async () => {
    const user = userEvent.setup()
    render(<StatefulLightbox />)
    const close = screen.getByRole("button", { name: "Close image viewer" })
    const previous = screen.getByRole("button", { name: "Previous image" })
    const next = screen.getByRole("button", { name: "Next image" })
    const dots = images.map((_, index) => screen.getByRole("button", { name: `Go to image ${index + 1}` }))

    expect(close).toHaveFocus()
    await user.tab()
    expect(previous).toHaveFocus()
    for (const dot of dots) {
      await user.tab()
      expect(dot).toHaveFocus()
    }
    await user.tab()
    expect(next).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(next).toHaveFocus()
  })

  it("retains focus on Previous, a dot, and Next while each changes the image", async () => {
    const user = userEvent.setup()
    render(<StatefulLightbox />)
    const previous = screen.getByRole("button", { name: "Previous image" })
    const firstDot = screen.getByRole("button", { name: "Go to image 1" })
    const next = screen.getByRole("button", { name: "Next image" })

    await user.tab()
    expect(previous).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByAltText("Project Alpha, image 3 of 3")).toBeInTheDocument()
    expect(previous).toHaveFocus()

    await user.tab()
    expect(firstDot).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByAltText("Project Alpha, image 1 of 3")).toBeInTheDocument()
    expect(firstDot).toHaveFocus()

    await user.tab()
    await user.tab()
    await user.tab()
    expect(next).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByAltText("Project Alpha, image 2 of 3")).toBeInTheDocument()
    expect(next).toHaveFocus()
  })

  it("keeps a one-image dialog on its only close control", async () => {
    const user = userEvent.setup()
    render(<ToggleLightbox collection={galleryImages(["one.jpg"])} />)
    await user.click(screen.getByRole("button", { name: "Open viewer" }))
    const close = screen.getByRole("button", { name: "Close image viewer" })

    expect(close).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(close).toHaveFocus()
  })

  it("restores exact focus and the prior inline body overflow value on close", async () => {
    const user = userEvent.setup()
    document.body.style.overflow = "clip"
    render(<ToggleLightbox />)
    const opener = screen.getByRole("button", { name: "Open viewer" })

    await user.click(opener)
    expect(document.body.style.overflow).toBe("hidden")
    expect(screen.getByRole("button", { name: "Close image viewer" })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument())
    expect(document.body.style.overflow).toBe("clip")
    expect(opener).toHaveFocus()
  })

  it("requests one state transition for a dot navigation click", () => {
    const onNavigate = vi.fn()
    render(
      <ImageLightbox
        isOpen
        images={images}
        currentIndex={0}
        clickedImageRect={null}
        projectName="Project Alpha"
        returnFocusRef={{ current: null }}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Go to image 3" }))

    expect(onNavigate).toHaveBeenCalledOnce()
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it("renders an announced initial failure while keeping every dialog control available", () => {
    render(<StatefulLightbox />)
    const imageFrame = screen.getByTestId("lightbox-image-frame")
    const failedImage = screen.getByAltText("Project Alpha, image 1 of 3")
    expect(imageFrame).toHaveAttribute("data-image-state", "loading")

    fireEvent.error(failedImage)

    expect(imageFrame).toHaveAttribute("data-image-state", "error")
    fireEvent.load(failedImage)
    expect(imageFrame).toHaveAttribute("data-image-state", "error")
    expect(within(imageFrame).getByRole("status")).toHaveTextContent("Could not load image 1 of 3 for Project Alpha.")
    expect(within(imageFrame).getByRole("status")).toHaveAttribute("aria-live", "polite")
    expect(within(imageFrame).getByRole("status")).toHaveAttribute("aria-atomic", "true")
    expect(failedImage).toHaveClass("opacity-0")
    expect(failedImage).toHaveAttribute("aria-hidden", "true")

    expect(screen.getByRole("button", { name: "Close image viewer" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Previous image" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Next image" })).toBeEnabled()
    images.forEach((_, index) => {
      expect(screen.getByRole("button", { name: `Go to image ${index + 1}` })).toBeEnabled()
    })
  })

  it("recovers after a navigated failure and starts fresh when revisiting it", () => {
    render(<StatefulLightbox />)

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" })
    fireEvent.error(screen.getByAltText("Project Alpha, image 2 of 3"))
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "error")
    expect(screen.getByText("Could not load image 2 of 3 for Project Alpha.")).toBeVisible()

    fireEvent.click(screen.getByRole("button", { name: "Next image" }))
    const succeedingImage = screen.getByAltText("Project Alpha, image 3 of 3")
    expect(screen.queryByText(/Could not load image/)).not.toBeInTheDocument()
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loading")

    fireEvent.load(succeedingImage)
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loaded")
    expect(succeedingImage).toHaveClass("opacity-100")

    fireEvent.click(screen.getByRole("button", { name: "Previous image" }))
    expect(screen.getByAltText("Project Alpha, image 2 of 3")).toBeInTheDocument()
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loading")
    expect(screen.queryByText(/Could not load image/)).not.toBeInTheDocument()
  })

  it("ignores late load and error events while navigating rapidly", () => {
    render(<StatefulLightbox />)
    const firstImage = screen.getByAltText("Project Alpha, image 1 of 3")

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" })
    const secondImage = screen.getByAltText("Project Alpha, image 2 of 3")
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" })
    const currentImage = screen.getByAltText("Project Alpha, image 3 of 3")

    fireEvent.load(firstImage)
    fireEvent.error(secondImage)

    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loading")
    expect(screen.queryByText(/Could not load image/)).not.toBeInTheDocument()

    fireEvent.load(currentImage)
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loaded")
    fireEvent.error(currentImage)
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loaded")
  })

  it("can close while the current image is still loading", () => {
    vi.useFakeTimers()
    render(<StatefulLightbox />)
    expect(screen.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loading")

    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }))
    act(() => vi.advanceTimersByTime(176))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open viewer" })).toHaveFocus()
    vi.useRealTimers()
  })

  it("closes from the surface around the image but not from the image-sized panel", () => {
    vi.useFakeTimers()
    render(<StatefulLightbox />)

    fireEvent.click(screen.getByTestId("lightbox-panel"))
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open")

    fireEvent.click(screen.getByTestId("lightbox-dismiss-surface"))
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "closing")
    act(() => vi.advanceTimersByTime(176))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
