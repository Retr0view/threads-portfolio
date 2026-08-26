import React, { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react"
import { vi } from "vitest"

const motionOnlyProps = new Set([
  "animate",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragPropagation",
  "dragTransition",
  "exit",
  "initial",
  "layout",
  "transition",
  "variants",
  "whileDrag",
  "whileTap",
])

type MotionProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode
  style?: CSSProperties & Record<string, unknown>
}

const cache = new Map<string, React.ComponentType<MotionProps>>()

function motionComponent(tag: string) {
  const cached = cache.get(tag)
  if (cached) return cached

  const Component = forwardRef<HTMLElement, MotionProps>(({ children, style, ...props }, ref) => {
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
    )
    const domStyle = style
      ? Object.fromEntries(
          Object.entries(style).filter(([, value]) =>
            typeof value !== "object" || value === null
          )
        )
      : undefined

    return React.createElement(tag, { ...domProps, ref, style: domStyle }, children)
  })
  Component.displayName = `MotionMock(${tag})`
  cache.set(tag, Component)
  return Component
}

export const motion = new Proxy({}, {
  get: (_target, tag: string) => motionComponent(tag),
}) as Record<string, React.ComponentType<MotionProps>>

export function AnimatePresence({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useReducedMotion() {
  return false
}

export function useMotionValue(initialValue: number) {
  let value = initialValue
  return {
    get: () => value,
    set: (nextValue: number) => {
      value = nextValue
    },
    stop: vi.fn(),
  }
}

export const animate = vi.fn(() => Promise.resolve())
