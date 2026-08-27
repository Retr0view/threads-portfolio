import { useScrollToTop } from "@/lib/hooks/use-scroll-to-top"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const motion = vi.hoisted(() => ({
  animations: [] as Array<Record<string, unknown>>,
  motionValue: {
    value: 0,
    get() { return this.value },
    set(next: number) { this.value = next },
  },
  reduced: false,
  stop: vi.fn(),
}))
const lenis = vi.hoisted(() => ({
  resize: vi.fn(),
  scroll: 300,
  scrollTo: vi.fn(),
}))

vi.mock("@/components/smooth-scroll", () => ({ useLenis: () => ({ lenis }) }))
vi.mock("framer-motion", () => ({
  useReducedMotion: () => motion.reduced,
  useMotionValue: (initial: number) => {
    motion.motionValue.value = initial
    return motion.motionValue
  },
  animate: (_value: unknown, _target: unknown, options: Record<string, unknown>) => {
    motion.animations.push(options)
    return { stop: motion.stop }
  },
}))

function Harness() {
  const mainRef = useRef<HTMLElement>(null)
  const { avatarPulse, scrollToTop } = useScrollToTop(mainRef)
  return (
    <main ref={mainRef} style={{ paddingTop: "7px", paddingBottom: "9px" }}>
      <button type="button" onClick={scrollToTop}>Run</button>
      <output>{avatarPulse}</output>
    </main>
  )
}

describe("useScrollToTop", () => {
  beforeEach(() => {
    motion.animations = []
    motion.reduced = false
    motion.stop.mockClear()
    lenis.scroll = 300
    lenis.resize.mockClear()
    lenis.scrollTo.mockClear()
  })

  it("owns the full two-stage run, emits arrival once, and restores prior padding", () => {
    render(<Harness />)
    const main = screen.getByRole("main")
    const run = screen.getByRole("button", { name: "Run" })

    fireEvent.click(run)
    fireEvent.click(run)
    expect(motion.animations).toHaveLength(1)
    expect(main).toHaveStyle({ paddingTop: "100px", paddingBottom: "100px" })

    act(() => (motion.animations[0]!.onComplete as () => void)())
    expect(motion.animations).toHaveLength(2)
    act(() => (motion.animations[1]!.onUpdate as (value: number) => void)(110))
    expect(screen.getByText("1")).toBeInTheDocument()

    act(() => (motion.animations[1]!.onComplete as () => void)())
    expect(main).toHaveStyle({ paddingTop: "7px", paddingBottom: "9px" })
    expect(lenis.scrollTo).toHaveBeenLastCalledWith(0, { immediate: true })
  })

  it("scrolls immediately without animation or avatar motion under reduced motion", () => {
    motion.reduced = true
    render(<Harness />)

    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    expect(motion.animations).toHaveLength(0)
    expect(lenis.scrollTo).toHaveBeenCalledWith(0, { immediate: true })
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("cancels controls and restores exact padding on unmount", () => {
    const view = render(<Harness />)
    const main = screen.getByRole("main")
    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    view.unmount()

    expect(motion.stop).toHaveBeenCalledOnce()
    expect(main).toHaveStyle({ paddingTop: "7px", paddingBottom: "9px" })
  })
})
