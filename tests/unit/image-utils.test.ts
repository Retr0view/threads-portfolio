import { calculateTransformOrigin } from "@/lib/image-lightbox-utils"
import { describe, expect, it, vi } from "vitest"

describe("calculateTransformOrigin", () => {
  it("uses the viewport-relative center of the clicked image", () => {
    vi.stubGlobal("innerWidth", 1_000)
    vi.stubGlobal("innerHeight", 800)
    const rect = {
      left: 0,
      top: 100,
      width: 200,
      height: 200,
    } as DOMRect

    expect(calculateTransformOrigin(rect, false)).toBe("10% 25%")
  })

  it.each([
    [null, false],
    [{ left: 0, top: 0, width: 100, height: 100 } as DOMRect, true],
  ])("falls back to a centered origin for null rectangles or reduced motion", (rect, reduced) => {
    expect(calculateTransformOrigin(rect, reduced)).toBe("center center")
  })
})
