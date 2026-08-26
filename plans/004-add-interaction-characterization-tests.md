# Plan 004: Add characterization coverage for critical interactions

> **Executor instructions**: Read the entire plan, execute steps in order, and stop on the named conditions. Update `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- package.json package-lock.json components/draggable-carousel.tsx components/image-lightbox.tsx components/intro-section.tsx lib/hooks/use-split-lines.ts lib/image-lightbox-utils.ts lib/image-utils.ts playwright.config.ts vitest.config.ts tests`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-restore-verification-baseline.md`, `plans/003-upgrade-next-security-line.md`
- **Category**: tests
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

The portfolio's signature behavior is concentrated in imperative DOM rewriting, gesture thresholds, global keyboard/body effects, and analytics timing, with no tests. Characterization coverage must land before Plans 005–010 so those fixes can prove they preserve intended motion and interaction behavior.

## Current state

- No test script, test files, test directories, or CI test job exists.
- `lib/hooks/use-split-lines.ts:34-100` rewrites paragraph DOM, responds to `ResizeObserver` and font readiness, and restores text on cleanup.
- `components/draggable-carousel.tsx:187-210,327-391` distinguishes drag from click, opens the lightbox in `requestAnimationFrame`, and records analytics using refs.
- `components/image-lightbox.tsx:85-139` implements global keyboard navigation and body scroll locking.
- Pure utilities at `lib/image-utils.ts` and `lib/image-lightbox-utils.ts` provide low-cost baseline cases.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Static gate | `npm run check` | exit 0 |
| Unit/DOM tests | `npm run test` | all tests pass |
| Browser smoke | `npm run test:e2e` | all target-browser tests pass |

## Scope

**In scope**: package manifest/lockfile, test-runner and browser-runner configs, new test setup/helpers, new tests for the named components/hooks/utilities, CI workflow updates, and minimal `data-testid`/accessible-selector changes required for robust tests.

**Out of scope**: changing production behavior, pixel snapshots, testing Framer Motion internals, broad visual regression infrastructure, and fixes from Plans 005–010.

## Git workflow

- Branch: `codex/004-interaction-tests`
- Commit message: `Add interaction characterization tests`

## Steps

### Step 1: Install a React 19-compatible unit/DOM stack

Use Vitest, jsdom, and Testing Library packages compatible with the installed React version. Add `test` and `test:watch` scripts. Update `check` to include the non-watch unit suite.

**Verify**: `npm run test` → runner starts and exits 0 with an initial utility test.

### Step 2: Characterize pure and DOM behavior

Test image-path normalization, transform-origin reduced-motion fallback, split-line grouping, resize resplitting without replay, timeout cleanup, and unmount text restoration. Mock `ResizeObserver`, `document.fonts.ready`, layout offsets, and timers explicitly; do not depend on wall-clock sleeps.

**Verify**: `npm run test` → named cases pass with fake timers restored after every test.

### Step 3: Characterize gallery and analytics behavior

Cover drag-versus-click gating, desktop breakpoint gating, open index, navigation, Escape, Home/End, body overflow restoration, close analytics duration/index payloads, and absence of duplicate events. Stub the tracker through `window.visitors` and restore it after each test.

**Verify**: `npm run test -- --run` → all cases pass with no act warnings or leaked globals.

### Step 4: Add a minimal browser suite

Use Playwright for Chromium plus one WebKit project if CI capacity allows. Cover homepage load, reduced motion, vertical scrolling over a carousel, desktop keyboard lightbox journey, image-error fallback hook point, and console-error absence. CI should install required browsers then run `test:e2e` after the production server starts.

**Verify**: `npm run test:e2e` → all configured projects pass twice consecutively.

## Test plan

- Pure utilities: normalization and reduced-motion transform-origin cases.
- DOM hook: line grouping, font readiness, resize without replay, timer cleanup, and unmount restoration.
- Components: drag-versus-click, breakpoint gating, every keyboard command, body overflow restoration, and exact analytics payloads.
- Browser: normal/reduced-motion load, touch scrolling, keyboard lightbox, and console-error absence.
- No existing test is available as a pattern; establish shared setup/helpers once and require later plans to reuse them.

## Done criteria

- [ ] `npm run check` includes unit tests and exits 0.
- [ ] Browser suite covers the five critical journeys without pixel-perfect assertions.
- [ ] No real network analytics calls occur in tests.
- [ ] CI runs static checks, unit tests, and browser smoke tests.
- [ ] Production behavior is unchanged.

## STOP conditions

- A test requires changing production behavior rather than adding a stable selector/seam.
- The selected runner does not support React 19 without legacy flags.
- Browser tests require credentials or external analytics availability.

## Maintenance notes

Prefer semantic selectors and behavior assertions. Each later interaction plan must add its regression case to this suite rather than creating a new runner.
