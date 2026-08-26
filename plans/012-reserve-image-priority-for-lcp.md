# Plan 012: Reserve image priority for the actual LCP candidate

> **Executor instructions**: Measure before changing priority. Use the image API supported by the upgraded Next version from Plan 003.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- app/page.tsx components/work-group.tsx components/draggable-carousel.tsx lib/work-groups.ts tests`

## Status

- **State**: DONE
- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/003-upgrade-next-security-line.md`, `plans/005-stop-raw-image-preloading.md`
- **Category**: perf
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

Cold-cache production traces at 390×844 and 1440×900 identified the first Neutron Rebrand image as LCP at both widths. The page now explicitly selects that work group, Next 16's `preload` and `fetchPriority="high"` apply only to its first image, and all other carousel images are lazy. Under identical 150 ms RTT, 1.6 Mbps download, and 4× CPU throttling, LCP changed from 7,976 to 7,908 ms on mobile and from 7,976 to 7,924 ms on desktop.

## Why this matters

Every carousel marks its first image as priority/eager, so four project images compete during initial load even though most are below the fold. Priority should be an explicit page-level decision based on the measured LCP candidate.

## Current state

- `app/page.tsx:24-48` iterates work groups but does not pass loading priority.
- `components/work-group.tsx:55-60` forwards project images without priority context.
- `components/draggable-carousel.tsx:422-465` assigns `priority` and eager loading whenever local `index === 0`.
- `lib/work-groups.ts:12-68` currently renders four groups in order.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Build | `npm run build` | exit 0 |
| Browser | `npm run test:e2e` | image-loading tests pass |

## Scope

**In scope**: explicit priority props through page/work-group/carousel, supported Next Image loading attributes, and performance/browser tests.

**Out of scope**: raw preload strategy already handled in Plan 005, image re-encoding, project ordering changes, or speculative device-size edits.

## Git workflow

- Branch: `codex/012-lcp-image-priority`
- Commit message: `Limit image preload priority`

## Steps

### Step 1: Measure LCP and request order

Capture cold-cache production traces at mobile and desktop widths. Identify whether text, profile image, or first project image is LCP and record the result in the PR description.

**Verify**: trace contains a named LCP element and its request priority.

### Step 2: Make priority page-owned

Add an explicit boolean such as `preloadFirstImage` from the work-group loop to `WorkGroup` and `DraggableCarousel`. Set it only for the measured candidate; all other images remain lazy. Use the installed Next version's current preload/fetch-priority API rather than a deprecated prop.

**Verify**: rendered/request inspection shows no more than one portfolio image preload and below-fold first images are lazy.

### Step 3: Lock behavior

Add a component test for prop propagation and browser request assertion for preload count.

**Verify**: `npm run check && npm run test:e2e && npm run build` → exit 0.

## Test plan

- Component case: only the page-selected work group receives the priority/preload prop and only its first image consumes it.
- Browser case: count portfolio preload links/high-priority requests at mobile and desktop widths; assert lazy behavior for lower groups.
- Performance trace: compare LCP element/time and request ordering with the Step 1 baseline under identical throttling.
- Verification: component tests and `npm run test:e2e` pass; no Next Image warnings appear.

## Done criteria

- [x] Priority is explicit at page composition level.
- [x] At most one justified portfolio image is preloaded.
- [x] No deprecated image-priority API warning appears.
- [x] LCP does not regress materially from baseline.

## STOP conditions

- The measured LCP is not an image; remove all portfolio preloads and report instead of choosing one arbitrarily.
- Different breakpoints require different candidates unsupported by the current composition.
- A change requires reordering portfolio projects.

## Maintenance notes

Re-measure when hero layout or project order changes. Do not infer priority from a carousel-local index again.
