# Loading animation behavior

The intro sequence is completion-driven. Browser layout decides how many biography lines exist; downstream content does not predict that duration.

## Sequence and ownership

`IntroSection` owns the profile header, three semantic biography paragraphs, social links, and the one-shot completion signal. `Home` owns project/divider reveal and the back-to-top control.

1. The avatar enters with its spring scale; name and tracked content date are supplied to `TextMorph` after their short local delays.
2. `useSplitLines` measures each paragraph into visual lines after layout. The second and third paragraphs keep their existing base offsets.
3. The last line in each paragraph reports its real `animationend`. Once all three have reported, `IntroSection` calls `onEntranceComplete` exactly once.
4. Social links and projects start their local stagger from that state change. Dividers remain relative to their project; the back-to-top control remains relative to the project count.

There is no exported biography-end duration and no hook timeout. CSS owns visual line duration/stagger; React observes completion.

## Visual-line and typography contract

Each paragraph keeps one stable `p` element. The hook temporarily measures token offsets, replaces them with one `.line` span per visual line, and retains `data-animated="true"` after completion. `ResizeObserver` and `document.fonts.ready` re-measure wrapping without replaying a completed entrance.

The typography is deliberately stable because wrapping is behavior here: OpenRunde WOFF2 at weights 400–700, the existing text measure, semantic paragraphs, and unitless `1.5` biography leading must remain intact unless the intro is intentionally redesigned.

## Reduced motion

With `prefers-reduced-motion: reduce`:

- the name/date and all measured lines render complete immediately;
- the completion signal fires without waiting for animation;
- avatar, social, project, carousel, lightbox, and scroll motion are omitted;
- the back-to-top action jumps immediately and does not emit an avatar pulse.

Both CSS and React guard visibility so content remains available if either lifecycle changes.

## Scroll-to-top lifecycle

`useScrollToTop` owns the Lenis command, internal motion value, active-run latch, temporary padding, controls, and finalizer. Normal motion preserves the short downward overshoot and spring arrival. The avatar pulse is emitted from observed spring progress near arrival, not an estimated timeout.

The same idempotent finalizer restores exact prior inline padding and stops controls on completion or unmount. Re-entry is ignored while a run is active.

## Verification

- `tests/unit/use-split-lines.test.tsx`: line grouping, font readiness, actual completion, resize/no replay, cleanup, and reduced motion.
- `tests/unit/use-scroll-to-top.test.tsx`: two-stage success, re-entry, reduced motion, arrival pulse, and unmount restoration.
- `tests/e2e/interactions.spec.ts`: production-browser intro and back-to-top behavior.
- `npm run check` and `npm run test:e2e`: full static, unit, and browser gates.
