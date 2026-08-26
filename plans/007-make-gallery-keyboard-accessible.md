# Plan 007: Make gallery and lightbox keyboard-accessible

> **Executor instructions**: Execute all gates, test with keyboard only, and stop on drift or scope expansion.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/draggable-carousel.tsx components/image-lightbox.tsx components/work-group.tsx tests`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`
- **Category**: bug
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

Keyboard users cannot open project images because each trigger is a clickable, non-focusable `div`. Once open, the lightbox lacks dialog semantics, initial focus, focus containment, and focus restoration. Existing arrow-key handling does not make the end-to-end journey accessible.

## Current state

- `components/draggable-carousel.tsx:441-455` renders the trigger as a `div` with `onClick` and pointer cursor, no keyboard handler or role.
- `components/image-lightbox.tsx:121-139` handles keys and body overflow globally.
- Lines 240-276 render the overlay/container without `role="dialog"`, `aria-modal`, an accessible name, or focus management.
- Dot/arrow buttons exist at lines 341-461; the only close mechanism is backdrop/extended zones/Escape.
- Global focus styling already exists at `app/globals.css:93-107`; reuse it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Browser | `npm run test:e2e` | keyboard journey passes |

## Scope

**In scope**: gallery trigger semantics, lightbox dialog/focus behavior, an accessible close control if needed, project-aware accessible labels, and tests.

**Out of scope**: visual redesign, mobile lightbox, gallery content rewrite, focus library adoption unless native implementation proves unsafe, or changing animation timing.

## Git workflow

- Branch: `codex/007-gallery-accessibility`
- Commit message: `Make gallery keyboard accessible`

## Steps

### Step 1: Make each image a real control

Use a semantic `button` or equivalent accessible control that preserves drag behavior. Give it a project-aware label such as “Open image 2 of 3 for Neutron Rebrand,” not “Carousel image 2.” Enter and Space must open the same index as pointer click; dragging must not activate it.

**Verify**: Testing Library can locate every trigger by role/name and activate it with keyboard.

### Step 2: Implement modal-dialog focus behavior

Add `role="dialog"`, `aria-modal="true"`, a stable accessible name, initial focus on a visible control/container, Tab/Shift+Tab containment, and focus restoration to the exact opener on close. Preserve Escape/Home/End/arrow behavior and restore the prior body overflow value rather than forcing an empty string.

**Verify**: browser test opens with Enter, cycles focus without reaching page-behind controls, closes with Escape, and observes focus on the opener.

### Step 3: Make controls perceivable

Ensure close/previous/next controls are visible on keyboard focus even when hover state is absent. Mark decorative click zones non-interactive to assistive technology and do not leave invisible buttons in the tab order.

**Verify**: `npm run test:e2e` passes keyboard-only and reduced-motion cases; automated accessibility scan reports no dialog/interactive-role violations.

## Test plan

- Extend Plan 004's gallery/lightbox specs rather than adding a new runner.
- Unit/DOM cases: role/name for each trigger, Enter/Space activation, drag suppression, dialog name/modal semantics, focus loop, and prior-focus restoration.
- Browser cases: complete keyboard-only open/navigate/close journey, visible focus without hover, reduced motion, and no access to page-behind controls.
- Verification: `npm run test -- gallery && npm run test:e2e` both pass.

## Done criteria

- [x] Every desktop gallery image is openable by Enter and Space; mobile images remain static per the existing lightbox policy.
- [x] Dialog has name, modal semantics, contained focus, and focus restoration.
- [x] Visible close/navigation controls work without hover.
- [x] Pointer drag/click behavior remains characterized and passing.
- [x] `npm run check` and browser tests pass.

## Verification results

- `npm run check` passes with 31 unit tests. The four lint warnings are unchanged findings outside Plan 007's files.
- Two consecutive `npm run test:e2e` runs pass in Chromium and WebKit: 29 passed and three WebKit skips per run, limited to Chromium-only CDP touch input.
- The production build passes on both browser runs, and `git diff --check` passes.
- The focused `@axe-core/playwright` scan passes in Chromium and WebKit for the open gallery/dialog subtree, covering dialog names, ARIA validity, hidden focus, button names, focus-order semantics, and nested interactive controls.
- WebKit pointer-drag input is paced across animation frames so the characterization emits a representative drag rather than coalescing into a click; five isolated repeats pass.

## STOP conditions

- Semantic buttons break Framer Motion dragging after two scoped attempts.
- Focus containment requires a new dependency; report native and library options first.
- The design owner rejects any visible close affordance; preserve semantics and report the conflict.

## Maintenance notes

Future gallery controls must be real controls, not clickable layout elements. Review both focus order and visual focus visibility.
