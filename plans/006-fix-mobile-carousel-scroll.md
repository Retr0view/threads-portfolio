# Plan 006: Preserve vertical scrolling over mobile carousels

> **Executor instructions**: Follow steps exactly, test on touch-capable browser projects, and stop rather than broadening gesture behavior.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/draggable-carousel.tsx lib/constants.ts tests`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`
- **Category**: bug
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

The carousel occupies a large portion of the mobile page. Its current touch-action axis permits native horizontal panning while suppressing vertical panning, contradicting the component's goal of handling horizontal drag while allowing normal page scroll.

## Current state

- `components/draggable-carousel.tsx:106-125` compares touch deltas and calls `preventDefault` only for deliberate horizontal movement.
- Lines 153-169 install non-passive touch/gesture listeners.
- Lines 405-420 configure Framer Motion `drag="x"` but set `touchAction: "pan-x"`.
- The custom breakpoint is 620 px in `lib/constants.ts:7-10` and Tailwind `xs` matches it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Browser | `npm run test:e2e -- --project=webkit` | touch tests pass |

## Scope

**In scope**: carousel touch-action/listener logic, related constants, and focused gesture tests.

**Out of scope**: momentum redesign, lightbox-on-mobile, trackpad behavior unrelated to touch, layout sizing, or visual styling.

## Git workflow

- Branch: `codex/006-mobile-carousel-scroll`
- Commit message: `Fix mobile carousel scrolling`

## Steps

### Step 1: Lock the regression with browser input

Add a browser test starting a predominantly vertical gesture over the middle of a carousel and assert the page scroll position changes. Add a horizontal gesture assertion that carousel translation changes without browser navigation.

**Verify**: the vertical test fails against current code while horizontal behavior is characterized.

### Step 2: Correct the gesture contract

Configure the drag surface to permit native vertical panning while Framer Motion handles horizontal drag. Keep interception directional and remove dead `isHorizontalSwipe` state if it has no behavior. Avoid preventing vertical or small ambiguous moves.

**Verify**: WebKit and Chromium mobile projects pass vertical, horizontal, diagonal, and tap cases.

### Step 3: Check edge navigation and orientation changes

Verify first-card swipes do not trigger unintended browser back navigation, and resizing/orientation changes keep constraints valid.

**Verify**: `npm run test:e2e && npm run check` → exit 0.

## Test plan

- Extend the browser carousel spec created by Plan 004.
- Cover vertical, horizontal, diagonal, short tap, drag-to-boundary, and orientation-change gestures.
- Run each behavioral case at one viewport below 620 px and one desktop viewport to prove desktop input is unchanged.
- Verification: `npm run test:e2e` passes twice in Chromium and WebKit.

## Done criteria

- [x] Vertical gestures begun over any carousel scroll the document.
- [x] Horizontal drags still move within constraints.
- [x] Taps do not become drags and desktop behavior is unchanged.
- [x] Supported touch tests pass in Chromium and WebKit; native WebKit swipes remain a manual-device check because Playwright exposes no WebKit swipe input API.

## Verification results

- `npm run check` passes with 25 unit tests and no new lint errors.
- `npm run test:e2e` passes in Chromium and WebKit: 25 passed, with three WebKit skips explicitly limited to Chromium CDP compositor-touch coverage.
- Chromium CDP proves native vertical page scrolling, horizontal carousel translation without app navigation, and updated drag constraints after a 600×390 to 390×700 resize.
- WebKit automation proves the `pan-y` contract, directional listener cancellation, the zero-coordinate edge regression, and real touchscreen taps. Synthetic touch events only prove listener cancellation; they do not prove native page scroll or browser back-navigation behavior.
- `npm run build` and `git diff --check` pass.

Manual iOS Safari verification remains required by the runner STOP condition:

1. In portrait, begin vertical and clearly vertical-diagonal swipes over the middle of each carousel; the document should scroll.
2. Swipe horizontally in both directions, including rightward from the first card and from the left viewport edge; the carousel should remain constrained and Safari should not navigate back.
3. Tap a card, rotate to landscape and back, then repeat the vertical and horizontal gestures; taps should not become drags and constraints should remain valid.

## STOP conditions

- The browser runner cannot emit representative touch/pointer events; report manual-device steps instead of faking confidence.
- A fix requires disabling horizontal dragging.
- Safari edge-navigation behavior cannot be preserved with the narrowed handler.

## Maintenance notes

Treat `touch-action` as the primary browser gesture contract; JavaScript listeners refine it afterward. Keep the vertical-scroll regression in the browser suite.
