# Plan 013: Harden third-party analytics script loading

> **Executor instructions**: Treat the analytics client identifier as public configuration, not a secret, and never copy its value into plans, logs, or tests. Confirm vendor support before selecting pinning or self-hosting.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- app/layout.tsx next.config.js lib/visitors.d.ts public scripts tests README.md`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/003-upgrade-next-security-line.md`, `plans/009-isolate-analytics-failures.md`
- **Category**: security
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

Every visitor executes an unrestricted script from a third-party CDN. Provider/CDN compromise would execute in the portfolio origin. The loading model needs a reviewable version/integrity policy or an explicit self-hosted update process, plus response headers matching the chosen model.

## Current state

- `app/layout.tsx:195-199` loads the remote analytics script after interaction and includes a browser-visible client identifier.
- `next.config.js:1-19` defines images only; no security headers or content-security policy exist.
- `lib/visitors.d.ts:1-6` declares the global tracking interface.
- Plan 009 isolates runtime tracker failure; this plan addresses executable supply-chain trust.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Build | `npm run build` | exit 0 |
| Headers | `curl -sSI http://localhost:3000/` | intended CSP/security headers present |
| Browser | `npm run test:e2e` | analytics allowed; unrelated script injection blocked |

## Scope

**In scope**: analytics script loading, a version/update mechanism if self-hosted, Next response headers, documentation, and production-mode tests.

**Out of scope**: changing vendor, new analytics events, legal/consent decisions, hiding or rotating the public client identifier, or a site-wide nonce architecture unless required by the chosen supported model.

## Git workflow

- Branch: `codex/013-analytics-script-hardening`
- Commit message: `Harden analytics script loading`

## Steps

### Step 1: Establish vendor-supported options

Consult official vendor documentation/terms for a stable versioned URL, published integrity hash, or permission to self-host. Record the supported choice and update cadence in the PR. Do not fabricate an integrity hash for a mutable URL.

**Verify**: chosen asset is demonstrably immutable/versioned or vendored with license/update provenance.

### Step 2: Implement the supported loading model

If immutable and CORS-compatible, add integrity and appropriate cross-origin attributes. If self-hosting is officially supported, vendor a reviewed version with license notice and an explicit update script/checksum. Retain `afterInteractive` unless vendor requirements differ.

**Verify**: production browser loads analytics successfully, a bad checksum test fails closed, and no duplicate script is loaded.

### Step 3: Add response hardening

Configure CSP/script-src and baseline headers (`X-Content-Type-Options`, referrer policy, frame restriction via CSP) for the actual sources used by Next and analytics. Start from production build behavior; do not use broad wildcard or `unsafe-eval` in production.

**Verify**: response headers are present; browser console has no CSP violations during normal flows; an injected unlisted script fixture is blocked.

## Test plan

Test analytics available/unavailable, integrity failure where supported, CSP production headers, normal Next hydration, inline JSON-LD, fonts/images, and tracker calls through the adapter. Never call the real vendor in unit tests.

## Done criteria

- [ ] Remote executable is immutable/integrity-checked or officially self-hosted with update provenance.
- [ ] Production headers allow only required script sources.
- [ ] Hydration, analytics, and all interactions pass under CSP.
- [ ] `npm run check`, build, and browser tests pass.

## STOP conditions

- Vendor offers only a mutable script and forbids self-hosting; report risk/alternatives for owner decision.
- Required CSP needs `unsafe-eval` in production.
- Self-hosting would remove required automatic security updates without an owned update process.

## Maintenance notes

Review the vendored/pinned asset on a documented cadence. CSP must be revisited when adding any new third-party browser code.
