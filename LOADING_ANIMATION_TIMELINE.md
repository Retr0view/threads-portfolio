# Loading animation behavior

The intro sequence restores the original fine-grained text motion. Name and date animate by letter, biography paragraphs animate by word, and downstream content waits for the final word plus a short pause.

## Sequence and ownership

`IntroSection` owns the profile header, three semantic biography paragraphs, social links, and the one-shot completion signal. `Home` owns project/divider reveal and the back-to-top control.

1. The avatar enters with its spring scale. The name and tracked content date animate letter by letter after their short local delays.
2. The first biography paragraph starts at 250ms. Each word animates for 200ms, with a 20ms stagger between word starts.
3. Each following paragraph starts 120ms after the prior paragraph's final word finishes.
4. The final word reports completion. After a 100ms pause, `IntroSection` calls `onEntranceComplete` exactly once.
5. Social links and projects start their local stagger from that state change. Dividers remain relative to their project; the back-to-top control remains relative to the project count.

`lib/intro-animation.ts` owns the derived paragraph schedule. It calculates starts and ends from the exact paragraph strings and the shared timing constants. React observes the final word completion instead of maintaining separate paragraph timers.

## Word and typography contract

Each paragraph keeps one semantic `p` element. Its words render as inline-block spans so browser wrapping remains natural while every word can carry its own opacity and vertical transition.

OpenRunde WOFF2 at weights 400–700, the existing text measure, semantic paragraphs, and unitless `1.5` biography leading remain intact.

## Reduced motion

With `prefers-reduced-motion: reduce`:

- the name, date, and biography paragraphs render complete immediately;
- the completion signal fires without waiting for animation;
- avatar, social, project, carousel, lightbox, and scroll motion are omitted;
- the back-to-top action jumps immediately and does not emit an avatar pulse.

The React motion boundary owns this behavior. Reduced motion does not wait for the post-biography pause.

## Scroll-to-top lifecycle

`useScrollToTop` owns the Lenis command, internal motion value, active-run latch, temporary padding, controls, and finalizer. Normal motion preserves the short downward overshoot and spring arrival. The avatar pulse is emitted from observed spring progress near arrival, not an estimated timeout.

The same idempotent finalizer restores exact prior inline padding and stops controls on completion or unmount. Re-entry is ignored while a run is active.

## Verification

- `tests/unit/intro-animation.test.ts`: exact word counts, paragraph timing, and final completion timing.
- `tests/unit/use-scroll-to-top.test.tsx`: two-stage success, re-entry, reduced motion, arrival pulse, and unmount restoration.
- `tests/e2e/interactions.spec.ts`: production-browser intro and back-to-top behavior.
- `npm run check` and `npm run test:e2e`: full static, unit, and browser gates.
