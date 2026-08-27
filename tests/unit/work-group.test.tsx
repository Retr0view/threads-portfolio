import { WorkGroup } from "@/components/work-group"
import { portfolioProjects } from "@/lib/portfolio-view-model"
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
    const workGroup = portfolioProjects[0]
    expect(workGroup).toBeDefined()

    const { rerender } = render(<WorkGroup workGroup={workGroup!} preloadFirstImage />)

    expect(screen.getByTestId("draggable-carousel")).toBeInTheDocument()
    expect(carouselRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        images: workGroup!.gallery,
        preloadFirstImage: true,
        projectName: workGroup!.name,
      })
    )

    rerender(<WorkGroup workGroup={workGroup!} preloadFirstImage={false} />)
    expect(carouselRender).toHaveBeenLastCalledWith(
      expect.objectContaining({ preloadFirstImage: false })
    )
  })

  it("renders validated description parts without injecting HTML", () => {
    render(<WorkGroup workGroup={portfolioProjects[0]!} preloadFirstImage={false} />)

    const credit = screen.getByRole("link", { name: "Studio Koto" })
    expect(credit).toHaveAttribute("href", "https://koto.com/")
    expect(credit).toHaveAttribute("rel", "noopener noreferrer")
  })
})
