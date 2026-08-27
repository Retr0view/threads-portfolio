import { useSplitLines } from "@/lib/hooks/use-split-lines"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  installMatchMedia,
  installResizeObserverMock,
  ResizeObserverMock,
} from "../helpers/browser-mocks"

const originalText = "Alpha beta gamma"

function SplitLinesHarness({ onComplete }: { onComplete?: () => void }) {
  const paragraphRef = useRef<HTMLParagraphElement>(null)
  useSplitLines(paragraphRef, { onInitialAnimationComplete: onComplete })
  return <p ref={paragraphRef} data-testid="paragraph">{originalText}</p>
}

function mockTokenLayout(getFirstLineTokenCount: () => number) {
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
    const siblings = this.parentNode ? Array.from(this.parentNode.childNodes) : []
    const index = siblings.indexOf(this)
    return index < getFirstLineTokenCount() ? 0 : 10
  })
}

function installFontsReady(ready: Promise<unknown>) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready },
  })
}

describe("useSplitLines", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installMatchMedia(false)
    installResizeObserverMock()
  })

  afterEach(() => {
    Reflect.deleteProperty(document, "fonts")
  })

  it("groups measured tokens into visual line spans", () => {
    installFontsReady(new Promise(() => undefined))
    mockTokenLayout(() => 2)
    render(<SplitLinesHarness />)

    const lines = screen.getByTestId("paragraph").querySelectorAll(":scope > .line")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toHaveTextContent("Alpha")
    expect(lines[0]).toHaveStyle({ "--line-index": "0" })
    expect(lines[1]).toHaveTextContent("beta gamma")
    expect(lines[1]).toHaveStyle({ "--line-index": "1" })
  })

  it("re-splits after fonts become ready", async () => {
    let resolveFonts!: () => void
    const fontsReady = new Promise<void>((resolve) => {
      resolveFonts = resolve
    })
    let firstLineTokenCount = 99
    installFontsReady(fontsReady)
    mockTokenLayout(() => firstLineTokenCount)
    render(<SplitLinesHarness />)
    expect(screen.getByTestId("paragraph").querySelectorAll(":scope > .line")).toHaveLength(1)

    firstLineTokenCount = 2
    await act(async () => {
      resolveFonts()
      await fontsReady
    })

    expect(screen.getByTestId("paragraph").querySelectorAll(":scope > .line")).toHaveLength(2)
  })

  it("re-splits on resize without replaying a completed animation", () => {
    installFontsReady(new Promise(() => undefined))
    let firstLineTokenCount = 2
    mockTokenLayout(() => firstLineTokenCount)
    render(<SplitLinesHarness />)
    const paragraph = screen.getByTestId("paragraph")

    fireEvent.animationEnd(paragraph.querySelector(":scope > .line:last-child")!, {
      animationName: "intro-line-in",
    })
    expect(paragraph).toHaveAttribute("data-animated", "true")

    firstLineTokenCount = 99
    act(() => ResizeObserverMock.instances[0].trigger())

    expect(paragraph.querySelectorAll(":scope > .line")).toHaveLength(1)
    expect(paragraph).toHaveAttribute("data-animated", "true")
  })

  it("clears its animation timeout and restores plain text on unmount", () => {
    installFontsReady(new Promise(() => undefined))
    mockTokenLayout(() => 2)
    const view = render(<SplitLinesHarness />)
    const paragraph = screen.getByTestId("paragraph")
    const observer = ResizeObserverMock.instances[0]
    view.unmount()

    expect(paragraph.textContent).toBe(originalText)
    expect(paragraph.querySelector(".line")).toBeNull()
    expect(paragraph).not.toHaveAttribute("data-animated")
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  it("marks lines complete immediately when reduced motion is requested", () => {
    const onComplete = vi.fn()
    installMatchMedia(true)
    installFontsReady(new Promise(() => undefined))
    mockTokenLayout(() => 2)
    render(<SplitLinesHarness onComplete={onComplete} />)

    expect(screen.getByTestId("paragraph")).toHaveAttribute("data-animated", "true")
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("reports actual final-line completion once and does not replay after resize", () => {
    const onComplete = vi.fn()
    installFontsReady(new Promise(() => undefined))
    mockTokenLayout(() => 2)
    render(<SplitLinesHarness onComplete={onComplete} />)
    const paragraph = screen.getByTestId("paragraph")

    fireEvent.animationEnd(paragraph.querySelector(":scope > .line:last-child")!, {
      animationName: "intro-line-in",
    })
    act(() => ResizeObserverMock.instances[0].trigger())
    fireEvent.animationEnd(paragraph.querySelector(":scope > .line:last-child")!, {
      animationName: "intro-line-in",
    })

    expect(onComplete).toHaveBeenCalledOnce()
  })
})
