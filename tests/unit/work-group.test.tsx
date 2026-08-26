import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const carouselRender = vi.hoisted(() => vi.fn())

vi.mock("@/components/draggable-carousel", () => ({
  DraggableCarousel: (props: { preloadFirstImage: boolean }) => {
    carouselRender(props)
    return <div data-testid="draggable-carousel" />
  },
}))
vi.mock("next/image", () => import("../helpers/next-image"))

describe("WorkGroup", () => {
  it("forwards the page-owned first-image preload decision", () => {
    const workGroup = workGroups[0]
    expect(workGroup).toBeDefined()

    const { rerender } = render(<WorkGroup workGroup={workGroup!} preloadFirstImage />)

    expect(screen.getByTestId("draggable-carousel")).toBeInTheDocument()
    expect(carouselRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        imageFolder: workGroup!.imageFolder,
        images: workGroup!.images,
        preloadFirstImage: true,
        projectName: workGroup!.name,
      })
    )

    rerender(<WorkGroup workGroup={workGroup!} preloadFirstImage={false} />)
    expect(carouselRender).toHaveBeenLastCalledWith(
      expect.objectContaining({ preloadFirstImage: false })
    )
  })
})
