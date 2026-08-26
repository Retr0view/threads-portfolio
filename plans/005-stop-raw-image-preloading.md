# Plan 005: Stop blanket-loading raw gallery originals

> **Executor instructions**: Run each verification gate and stop on any STOP condition. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/draggable-carousel.tsx components/image-lightbox.tsx lib/constants.ts tests`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`
- **Category**: perf
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

All four carousels eventually request all 11 raw JPEGs, roughly 9.9 MB, regardless of lightbox use. These URLs differ from the optimized `next/image` URLs, so the preload can add transfer without warming what the UI renders.

## Current state

- `components/draggable-carousel.tsx:212-237` creates both a raw `<link rel="preload">` and `window.Image` for hover/open intent.
- Lines 239-325 idle-preload every image in every carousel using the same duplicate raw strategy.
- `components/image-lightbox.tsx:184-223` repeats raw preloads for current/adjacent indices.
- Rendered images use `next/image` at `draggable-carousel.tsx:456-465` and `image-lightbox.tsx:299-317`.
- Preserve `normalizeImagePath` and the existing blur placeholder behavior.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Browser | `npm run test:e2e` | all tests pass |
| Build | `npm run build` | exit 0 |

## Scope

**In scope**: the two gallery components, preload constants that become unused, and focused unit/browser tests.

**Out of scope**: re-encoding source assets, changing image composition/quality, mobile lightbox, carousel gestures, or CDN/provider changes.

## Git workflow

- Branch: `codex/005-image-preloading`
- Commit message: `Optimize gallery image preloading`

## Steps

### Step 1: Capture a cold-cache baseline

Using the production build, record request count and transferred bytes before interaction, after idle, and after first lightbox open. Distinguish raw `/images/...jpg` requests from `/_next/image` requests. Save the figures in the PR description, not the repository.

**Verify**: baseline identifies whether all 11 originals are requested after idle.

### Step 2: Remove whole-gallery raw preloading

Delete the idle preload effect and its link/timeout bookkeeping. Do not replace it with another all-image preload. Keep lazy carousel images and blur placeholders.

**Verify**: `rg -n "preloadAllImages|ALL_IMAGES_TIMEOUT|requestIdleCallback" components/draggable-carousel.tsx lib/constants.ts` → no obsolete gallery-preload matches.

### Step 3: Use one intent-based strategy

On hover/focus/open, prioritize only the selected image and at most its immediate neighbors using a Next-compatible rendered-image strategy. Do not issue both a raw preload link and `window.Image`. Deduplicate indices for one- and two-image galleries.

**Verify**: browser test opens each project and navigates next/previous without duplicate raw requests; `npm run check` passes.

## Test plan

Add tests for no idle raw downloads, deduplicated adjacent indices, one/two/many image collections, and responsive lightbox navigation. Use Playwright network observation, not timing guesses.

## Done criteria

- [x] Idle homepage no longer fetches every raw original.
- [x] First lightbox image still becomes usable without a broken placeholder transition.
- [x] Cold-cache transferred bytes are materially lower than baseline.
- [x] `npm run check`, `npm run test:e2e`, and `npm run build` pass.

## STOP conditions

- Next's installed image API cannot express intent-based preload without rendering a duplicate image.
- Removing raw preload causes a reproducible blank interval longer than the accepted product threshold; report measured traces.
- The required fix expands to an external image CDN migration.

## Maintenance notes

Review future preload additions by optimized URL identity and measured user benefit. A `<link>` plus `Image()` for the same resource is redundant.
