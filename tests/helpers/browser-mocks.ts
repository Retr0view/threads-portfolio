import { vi } from "vitest"

export class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = []

  readonly observe = vi.fn()
  readonly unobserve = vi.fn()
  readonly disconnect = vi.fn()

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  trigger() {
    this.callback([], this)
  }
}

export function installResizeObserverMock() {
  ResizeObserverMock.instances = []
  vi.stubGlobal("ResizeObserver", ResizeObserverMock)
}

export function installMatchMedia(matches: boolean) {
  const matchMedia = vi.fn().mockImplementation((media: string): MediaQueryList => ({
    matches,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  vi.stubGlobal("matchMedia", matchMedia)
  return matchMedia
}
