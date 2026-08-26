"use client"

import { useLayoutEffect } from "react"

const LINE_STAGGER_MS = 60
const LINE_DURATION_MS = 500

export interface UseSplitLinesOptions {
  /** Delay (ms) before this paragraph's first line animates (e.g. for second paragraph). */
  baseDelayMs?: number
}

/**
 * Splits paragraph text into visual lines (by measuring where the browser wraps),
 * wraps each line in a span with .line and --line-index.
 * - On first load: lines animate once (opacity + translateY), then paragraph gets data-animated="true".
 * - On resize: re-splits for correct wrapping; new lines render at final state (no replay).
 * Does not remount; respects prefers-reduced-motion (no animation, data-animated set immediately).
 */
export function useSplitLines(
  ref: React.RefObject<HTMLParagraphElement | null>,
  options: UseSplitLinesOptions = {}
) {
  const { baseDelayMs = 0 } = options

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const original = el.textContent || ""
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let animatedTimeoutId: number | undefined

    const split = () => {
      // Reset to plain text before re-splitting (keeps same <p> node, no remount).
      el.textContent = original

      // Wrap words/spaces so we can detect line starts via offsetTop (no whiteSpace:pre so they wrap).
      const tokens = original.split(/(\s+)/)
      const frag = document.createDocumentFragment()
      for (const token of tokens) {
        const span = document.createElement("span")
        span.textContent = token
        frag.appendChild(span)
      }

      el.innerHTML = ""
      el.appendChild(frag)

      const nodes = Array.from(el.childNodes) as HTMLElement[]
      const lines: HTMLElement[][] = []
      let currentTop: number | null = null

      for (const node of nodes) {
        const top = node.offsetTop
        if (currentTop === null || top !== currentTop) {
          lines.push([])
          currentTop = top
        }
        lines[lines.length - 1].push(node)
      }

      // Replace token spans with one span per visual line.
      el.innerHTML = ""
      lines.forEach((lineNodes, index) => {
        const line = document.createElement("span")
        line.className = "line"
        line.style.setProperty("--line-index", String(index))
        lineNodes.forEach((n) => line.appendChild(n))
        el.appendChild(line)
      })

      // After first run: either mark animated (reduced motion) or schedule mark after animation.
      if (!el.dataset.animated) {
        if (reducedMotion) {
          el.dataset.animated = "true"
        } else {
          if (animatedTimeoutId) window.clearTimeout(animatedTimeoutId)
          const delayMs = baseDelayMs + (lines.length - 1) * LINE_STAGGER_MS + LINE_DURATION_MS
          animatedTimeoutId = window.setTimeout(() => {
            el.dataset.animated = "true"
            animatedTimeoutId = undefined
          }, delayMs)
        }
      }
    }

    split()

    const ro = new ResizeObserver(() => split())
    ro.observe(el)
    document.fonts?.ready.then(split)

    return () => {
      if (animatedTimeoutId) window.clearTimeout(animatedTimeoutId)
      ro.disconnect()
      el.textContent = original
      delete el.dataset.animated
    }
  }, [baseDelayMs, ref])
}
