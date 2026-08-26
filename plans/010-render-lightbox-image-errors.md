# Plan 010: Render a deterministic lightbox image-error state

> **Executor instructions**: Keep navigation and close controls usable on failure. Run all error-path tests and stop on scope expansion.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/image-lightbox.tsx components/draggable-carousel.tsx tests`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`, `plans/007-make-gallery-keyboard-accessible.md`
- **Category**: bug
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

The lightbox detects failed image loads but never renders the error state. Users are left with a permanent blur or blank area and no explanation, although navigation could let them recover.

## Current state

- `components/image-lightbox.tsx:75-77` declares `imageLoaded` and `imageError`.
- Lines 166-182 reset the error and loading state on source change.
- Lines 283-317 keep placeholder/image opacity tied only to `imageLoaded`; `onError` merely sets `imageError`.
- Navigation/dots/arrows remain outside the image element and should survive failure.

## Commands you will need

| Purpose       | Command                    | Expected on success         |
| ------------- | -------------------------- | --------------------------- |
| Gate          | `npm run check`            | exit 0                      |
| Focused tests | `npm run test -- lightbox` | failure cases pass          |
| Browser       | `npm run test:e2e`         | broken-image journey passes |

## Scope

**In scope**: lightbox loading/error presentation, accessible error copy, retry only if it can be deterministic, and tests.

**Out of scope**: image hosting, source validation, redesigning navigation, fallback project assets, or hiding broken content silently.

## Git workflow

- Branch: `codex/010-lightbox-errors`
- Commit message: `Add lightbox image error state`

## Steps

### Step 1: Define loading, loaded, and failed states

Make the three states mutually exclusive per `imageSrc`. Guard late load/error events from a previous source so rapid navigation cannot overwrite the current state.

**Verify**: fake-timer/component tests navigate rapidly and assert stale events do not affect the new image.

### Step 2: Render an accessible failure presentation

When failed, remove indefinite loading opacity and show concise text identifying which project image failed. Keep close, dots, previous, and next controls available; announce the error with appropriate live/status semantics without repeated announcements.

**Verify**: Testing Library finds the failure message by role/text and can navigate to a succeeding image.

### Step 3: Cover recovery

Test failure on initial open and after navigation, then navigate away and back. Add retry only if cache/network semantics are explicit; otherwise navigation is the recovery path.

**Verify**: focused and browser suites pass with no unhandled Next Image errors.

## Test plan

- Extend the Plan 004 lightbox spec.
- Cover failed initial image, failure after navigation, valid image after failure, revisit of a failed image, late event from a previous source, and close during loading.
- Assert failure text is accessible and previous/next/close remain operable.
- Verification: `npm run test -- lightbox && npm run test:e2e` pass.

## Done criteria

- [x] A failed image never leaves an indefinite blank/blur state.
- [x] Error is announced and all modal controls remain usable.
- [x] Navigation resets state and ignores stale events.
- [x] `npm run check` and browser suite pass.

## Verification results

- `npm run check` passes with 34 unit tests. The four lint warnings are unchanged findings outside Plan 010's files.
- `npm run test -- lightbox` passes all 15 focused tests, including initial and navigated failures, recovery and revisit, rapid-navigation stale events, terminal-event ordering, and close during loading.
- `npm run test:e2e` passes the production build and browser suite in Chromium and WebKit: 29 passed and three expected WebKit skips for Chromium-only CDP touch input.
- The failed-image browser journey passes its focused `@axe-core/playwright` scan and verifies visible polite status copy, operable controls, successful navigation away, deterministic failure on revisit, and close.
- `git diff --check` passes, the production build creates no new tracked output, and no Playwright web server remains on TCP port 3100.

## STOP conditions

- Next Image does not expose a stable error seam under the installed version.
- Error handling requires changing project data or image URLs; defer to Plan 011.
- The design calls for silently closing the lightbox, which would hide the failure.

## Maintenance notes

Keep error UI inside the same aspect-ratio frame to avoid layout shift. Review stale-event guards whenever image loading is refactored.
