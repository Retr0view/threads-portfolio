# Loading animation behavior

This document explains the current intro sequence and where each part is owned. It describes stable symbols and lifecycle rules rather than source line positions.

## Sequence

`IntroSection` renders the profile header, three biography paragraphs, and social links. `Home` renders the work groups, dividers, and back-to-top control after the biography sequence.

The visible sequence is:

1. The profile avatar enters with its initial spring scale.
2. The name and tracked content date are supplied to `TextMorph` after `ANIMATION.NAME_DELAY` and `ANIMATION.DATE_DELAY`.
3. The first biography paragraph begins its measured-line entrance.
4. The second and third paragraphs begin at `ANIMATION.INTRO_SECOND_PARA_LINE_BASE_DELAY_MS` and `ANIMATION.INTRO_THIRD_PARA_LINE_BASE_DELAY_MS`.
5. Social links begin from `BIO_ANIMATION_END`, with `ANIMATION.SOCIAL_LINK_STAGGER` between links.
6. Work groups begin from the same completion boundary, with `ANIMATION.WORK_GROUP_STAGGER` between groups. Each divider waits for its work group to finish plus `ANIMATION.DIVIDER_DELAY_AFTER_WORK_GROUP`.
7. The back-to-top control uses its own delay derived from the same biography boundary and the work-group count.

`BIO_ANIMATION_END` is exported by `components/intro-section.tsx` as the page-level alias of `ANIMATION.INTRO_PARAGRAPH_ANIMATION_END_S`. Downstream elements use that boundary instead of recreating the biography completion calculation.

## Visual-line measurement

Each biography paragraph keeps one stable `p` element and passes its ref to `useSplitLines` in `lib/hooks/use-split-lines.ts`.

On the first layout pass, the hook:

1. Reads the paragraph's plain text.
2. Temporarily wraps tokens so their vertical offsets can be measured.
3. Groups tokens that share a vertical offset into one visual line.
4. Replaces the temporary tokens with one `.line` span per measured line.
5. Assigns `--line-index` so CSS can stagger the entrance.
6. Sets `data-animated="true"` after the final line finishes.

The CSS in `app/globals.css` starts each unfinished line below its final position at zero opacity, then animates it upward into the visible final state. Paragraph base offsets come from `ANIMATION` and are passed through `--line-base-delay`.

`ResizeObserver` and `document.fonts.ready` both call the measurement again. Once `data-animated` is set, replacement lines render in their final state, so a font change or viewport resize does not replay the entrance. Cleanup disconnects the observer, clears a pending completion timer, restores plain text, and removes the marker.

The visual line duration and stagger must remain synchronized between the hook's completion calculation and the CSS animation. The paragraph base offsets and the downstream completion boundary live in `lib/constants.ts`. When timing changes, verify these implementation points together:

- `ANIMATION.INTRO_SECOND_PARA_LINE_BASE_DELAY_MS`
- `ANIMATION.INTRO_THIRD_PARA_LINE_BASE_DELAY_MS`
- `ANIMATION.INTRO_PARAGRAPH_ANIMATION_END_S`
- the local line timing in `lib/hooks/use-split-lines.ts`
- the `.intro-paragraph-lines` rules in `app/globals.css`

Do not infer that a constant is active from its name alone. Trace its imports before changing it.

## Reduced motion

The sequence has both React and CSS safeguards for `prefers-reduced-motion`:

- `IntroSection` shows the full name and date immediately and skips avatar entrance and bounce motion.
- `useSplitLines` marks measured paragraphs complete immediately.
- The CSS media query removes line animation and renders full-opacity text at its final transform.
- `Home` and the carousel omit entrance offsets and animated initial states.
- The lightbox retains a short fade but removes its scale change and position-derived transform origin.

The duplicated safeguards are intentional. Content remains visible if either the JavaScript timing lifecycle or CSS animation path changes.

## Scroll-to-top interaction

`useScrollToTop` coordinates Lenis scrolling and the profile-avatar bounce. The back-to-top link prevents default anchor movement, delegates scrolling to the hook, and uses the hook's state to request the avatar bounce. Reduced-motion users skip the bounce.

This interaction is separate from the initial load sequence even though it reuses constants from `ANIMATION`.

## Verification boundaries

Current automated coverage includes:

- `tests/unit/use-split-lines.test.tsx` for visual-line grouping, font readiness, resize without replay, cleanup, and reduced motion.
- `tests/e2e/interactions.spec.ts` for completed reduced-motion intro content.
- `npm run check` for TypeScript, ESLint, deterministic generation fixtures, and unit tests.
- `npm run test:e2e` for the production-browser interaction suite.

When changing sequence timing, test both a normal first load and a reduced-motion load. Resize after the intro completes and confirm that wrapping updates without another entrance.
