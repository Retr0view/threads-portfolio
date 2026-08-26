# Plan 009: Decouple core interactions from analytics failures

> **Executor instructions**: Preserve event names and payload meaning while making tracking best-effort. Stop if the vendor API contract is not the one declared locally.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/draggable-carousel.tsx app/page.tsx components/intro-section.tsx lib/visitors.d.ts lib tests`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`
- **Category**: bug
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

Telemetry is nonessential, but lightbox handlers call the third-party tracker inline. If the loaded vendor object throws or has an unexpected shape, the close handler exits before closing the UI, turning analytics failure into an interaction failure.

## Current state

- `lib/visitors.d.ts:1-6` declares optional `window.visitors` with a `track` function.
- `components/draggable-carousel.tsx:327-354` tracks Lightbox Open inside the open handler.
- Lines 367-385 track Lightbox View before `setLightboxOpen(false)`.
- Social/back-to-top tracking uses data attributes in `intro-section.tsx:195-203` and `app/page.tsx:151-155`.
- Maintain current event names/properties and never log the client identifier.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Focused tests | `npm run test -- analytics` | all analytics cases pass |

## Scope

**In scope**: a small failure-isolated analytics adapter, existing call sites, type declaration if required, and focused tests.

**Out of scope**: changing analytics vendor, event taxonomy, consent/privacy policy, script hosting, or adding events.

## Git workflow

- Branch: `codex/009-analytics-isolation`
- Commit message: `Isolate analytics failures`

## Steps

### Step 1: Add a best-effort tracking boundary

Create one client-only helper accepting the typed event and property object. It must verify the function exists, catch synchronous vendor exceptions, never throw to callers, and avoid noisy production logging. Keep it easy to stub in tests.

**Verify**: unit tests cover vendor absent, function absent, success, and throwing function.

### Step 2: Make state transitions unconditional

Move lightbox open/close state changes outside the analytics failure path. On close, capture duration/index payload, clear tracking refs, and close even when tracking fails. Route existing direct calls through the helper.

**Verify**: a test with a throwing tracker still opens, navigates, closes, resets refs, and emits no unhandled error.

### Step 3: Preserve event contracts

Assert the existing project, duration, opened/closed index and one-based number properties are unchanged and emitted once.

**Verify**: `npm run test -- analytics && npm run check` → exit 0.

## Test plan

- Adapter cases: global absent, tracker absent, successful call, synchronous throw, and malformed properties rejected by types.
- Interaction cases: open and close still complete on tracker failure; refs reset; each success event fires once with unchanged zero/one-based indices and duration.
- Reuse Plan 004's window-global cleanup helper and fake clock conventions.
- Verification: `npm run test -- analytics` passes without real network calls.

## Done criteria

- [ ] No primary handler invokes `window.visitors.track` directly.
- [ ] Vendor absence/throw cannot block UI state.
- [ ] Event names and payload meanings are unchanged.
- [ ] Focused tests and full gate pass.

## STOP conditions

- Runtime vendor shape differs from `lib/visitors.d.ts` in production evidence.
- The fix requires changing consent or script-loading policy; defer to Plan 013.
- A requested retry/queue mechanism would persist user data; report separately.

## Maintenance notes

All future events should cross the adapter. Keep telemetry failure invisible to users and never couple it to navigation/state success.
