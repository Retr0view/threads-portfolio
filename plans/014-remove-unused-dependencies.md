# Plan 014: Remove unused dependencies and dead utility scaffolding

> **Executor instructions**: Prove every target has no caller before removal. Do not combine this cleanup with dependency upgrades.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- package.json package-lock.json lib/utils.ts components.json app components lib scripts`

## Status

- **Execution status**: DONE — 2026-08-26
- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-restore-verification-baseline.md`
- **Category**: tech-debt
- **Planned at**: commit `2699551`, 2026-08-22

## Why this matters

The direct `cambio` dependency has no source import but installs Motion 12 and a nested Framer Motion 12 beside the app's Framer Motion 11. `clsx` and `tailwind-merge` are used only by an unreferenced utility module. Removing confirmed dead packages reduces install/review surface without changing the browser bundle.

## Current state

- `package.json:15-18,25` declares `cambio`, `clsx`, `framer-motion`, and `tailwind-merge`.
- Repository search finds no `cambio` or `motion` import in application source.
- `lib/utils.ts:1-16` defines `cn()` using `clsx` and `tailwind-merge`; no repository file imports `lib/utils`.
- `components.json` may reference the utility path for future shadcn generation; inspect it before deletion.
- Keep `torph`, which is used by `components/intro-section.tsx:11`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Search | `rg -n "cambio|from ['\"]motion|@/lib/utils|\bcn\(" app components lib scripts` | only reviewed target definitions or no matches |
| Install tree | `npm ls cambio motion clsx tailwind-merge` | targets absent after removal |
| Gate | `npm run check && npm run build` | exit 0 |

## Scope

**In scope**: package manifest/lockfile, `lib/utils.ts`, and `components.json` only if its generator contract requires retaining or relocating `cn()`.

**Out of scope**: upgrading Framer Motion 11, replacing Torph, removing shadcn metadata, or general dead-code sweeps.

## Git workflow

- Branch: `codex/014-unused-dependencies`
- Commit message: `Remove unused dependencies`

## Steps

### Step 1: Confirm runtime and generator reachability

Search tracked source and inspect `components.json`. If shadcn actively needs `@/lib/utils`, retain `cn`, `clsx`, and `tailwind-merge` and remove only Cambio. Otherwise include the dead utility pair.

**Verify**: write the search evidence in the PR description; no unexplained caller remains.

### Step 2: Remove confirmed-unused packages

Use `npm uninstall` for each confirmed target so package and lockfile agree. Delete `lib/utils.ts` only when no generator convention requires it.

**Verify**: `npm ls cambio motion` does not show the Cambio/Motion 12 branch; remaining dependency tree is valid.

### Step 3: Verify clean installation and build

Run `npm ci` in a disposable clean environment or CI, then static checks/build.

**Verify**: `npm ci && npm run check && npm run build` → exit 0.

## Test plan

- No new behavioral tests are required for manifest-only removal.
- Run the full existing unit/browser suite to catch hidden dynamic or generator consumers.
- Run shadcn's non-mutating configuration validation if available; otherwise inspect `components.json` and document why `cn()` was kept or removed.
- Verification: clean install, `npm run check`, `npm run test:e2e`, and build all pass.

## Done criteria

- [x] Cambio and its Motion 12 subtree are absent.
- [x] Utility dependencies are removed only if `cn()` has no runtime/generator owner.
- [x] Manifest and lockfile agree.
- [x] Clean install, checks, and build pass.

## Completion note

Completed on 2026-08-26. Repository-wide source search found no Cambio or `motion` caller. Before removal, the isolated branch was `cambio@1.1.5` → `motion@12.23.26` → nested `framer-motion@12.23.26`; `npm uninstall cambio` removed that branch while preserving the directly used `framer-motion@11.18.2` installation.

The utility slice was intentionally retained. `npx shadcn@latest info --json` validated the active project configuration and resolved `aliases.utils` to `lib/utils`; a non-mutating registry view of the standard button confirmed generated components import `cn` from `@/lib/utils`. Therefore `components.json`, `lib/utils.ts`, `clsx`, and `tailwind-merge` still have a generator owner even though application source has no current `cn()` caller.

Verification passed after a clean `npm ci`: `npm ls cambio motion --all` returned an empty tree, the retained Framer Motion and utility dependencies remained valid, the production audit reported zero vulnerabilities, `npm run check` passed 50 tests with no errors, and the full browser suite passed 33 tests with 3 environment-specific skips. Both the browser-suite build and a separate production build passed; the separate build preserved the complete before/after working-tree status hash. Shadcn project inspection was non-mutating, and `git diff --check` passed.

## STOP conditions

- `components.json` is actively used and requires `lib/utils.ts`; retain that slice.
- A dynamic import or generator outside searched paths consumes a target.
- Removal changes rendered output or generated component behavior.

## Maintenance notes

Dead install dependencies still carry audit and update cost even when tree-shaken. Keep cleanup evidence scoped and reproducible.
