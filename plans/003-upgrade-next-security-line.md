# Plan 003: Upgrade the vulnerable Next.js dependency line

> **Executor instructions**: Follow the steps and verify each one. Never use `npm audit fix --force`. Stop and report on any STOP condition. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- package.json package-lock.json next.config.js app components lib`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-restore-verification-baseline.md`, `plans/002-make-generation-non-dirtying.md`
- **Category**: security
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

The lockfile pins Next.js 16.0.10, and `npm audit --omit=dev` reports high-severity advisories affecting framework surfaces used by this App Router and `next/image` application. The goal is a deliberate framework update with a clean audit and interaction verification, not a blind lockfile rewrite.

## Current state

- `package.json:20` declares `next: ^16.0.10`; `package-lock.json:4895-4896` resolves 16.0.10.
- `package.json:35` aligns `eslint-config-next` at 16.0.10.
- `app/layout.tsx` and `app/page.tsx` use App Router; both carousel and lightbox use `next/image`.
- `next.config.js:3-17` customizes image formats, sizes, and cache TTL.
- The production audit currently reports five high-severity packages; some transitive build-tool findings are not reachable from untrusted input, but the framework/RSC findings are.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Preflight | `npm run check` | exit 0 |
| Audit | `npm audit --omit=dev --audit-level=high` | exit 0 or documented unreachable remainder |
| Build | `npm run build` | exit 0, no tracked-source changes |

## Scope

**In scope**: `package.json`, `package-lock.json`, `next.config.js`, and only source files requiring documented compatibility changes from the chosen patched Next 16 release.

**Out of scope**: React major upgrades, redesigns, broad lint cleanup, switching hosting providers, `npm audit fix --force`, and unrelated dependency modernization.

## Git workflow

- Branch: `codex/003-next-security-upgrade`
- Commit message: `Upgrade Next.js security line`

## Steps

### Step 1: Select the smallest supported patched release

Use official Next.js security advisories/release notes to choose a stable patched Next 16 version. Keep `next` and `eslint-config-next` aligned. Update with an explicit npm command and inspect every manifest/lockfile change.

**Verify**: `npm ls next eslint-config-next` → one compatible version line for each, no invalid peer dependencies.

### Step 2: Apply required compatibility changes only

Run `npm run check` and `npm run build`. Address only documented Next compatibility failures, especially image preload/priority deprecations and config validation. Do not opportunistically refactor components.

**Verify**: `npm run check && npm run build` → both exit 0; `git status --short` is unchanged by the build itself.

### Step 3: Re-evaluate the production audit

Run the production-only audit. Any remaining high advisory must be mapped to an actually used runtime/build surface in a short code comment in the PR description, not suppressed in source.

**Verify**: `npm audit --omit=dev --audit-level=high` → exit 0. If it does not, STOP unless every remaining high is proven unreachable and the owner accepts it.

## Test plan

After Plan 004 exists, run its browser smoke suite. Before then, manually verify the homepage renders, optimized images load, carousels drag, desktop lightbox opens/navigates/closes, metadata routes respond, and reduced-motion mode avoids entrance motion.

## Done criteria

- [x] Installed Next version is patched for applicable high advisories.
- [x] `npm run check`, `npm run build`, and production audit pass.
- [x] No peer dependency warnings or duplicate Next installations.
- [x] Source changes are limited to required compatibility adjustments.

## Completion note

Completed on 2026-08-26 with exact pins for `next` and `eslint-config-next` at 16.3.3. The [August 2026 security release](https://nextjs.org/blog/august-2026-security-release) and its [image-optimizer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) identify 16.3.3 as the smallest patched stable Next 16 release. This application uses the App Router, React Server Components, and the built-in AVIF image optimizer, so the framework and image-processing findings were treated as reachable even though middleware, rewrites, Server Actions, Cache Components, custom-server, and Windows-hosting prerequisites are absent here.

Next 16.3 auto-generated root agent instruction files during `next dev`; `agentRules: false` preserves Plan 002's non-dirtying development contract. `images.qualities: [75, 95]` preserves the existing lightbox quality instead of allowing Next 16 to coerce it to 75. No component source compatibility change was required. The lockfile also refreshed the audit-reported `picomatch` instances within their existing dependency ranges (2.3.2 and 4.0.7).

Verification passed: one aligned installation from `npm ls next eslint-config-next`, `npm run check`, two successful production builds whose before/after tracked-state hashes matched exactly, and `npm audit --omit=dev --audit-level=high` with zero findings. Browser smoke covered the desktop and 390px layouts, optimized AVIF responses, horizontal carousel movement, desktop lightbox open/next/Escape-close, and successful homepage/manifest/robots/sitemap responses. The available browser could not emulate `prefers-reduced-motion` or translate its pointer-drag primitive to the Framer Motion track; the reduced-motion CSS/hook branches were inspected, and horizontal wheel input moved the carousel track from 0 to -240px.

## STOP conditions

- The only patched path requires a Next major upgrade.
- An advisory remains reachable with no patched stable release.
- Build requires disabling a security feature, type checking, linting, or image optimization.

## Maintenance notes

Keep framework and ESLint config versions aligned. Re-run the production audit in CI or scheduled maintenance; do not treat all transitive advisories as equally reachable.
