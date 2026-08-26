# Plan 002: Make development and builds deterministic and non-dirtying

> **Executor instructions**: Execute every step and gate in order. Stop rather than improvising when a STOP condition occurs. Update the row in `plans/README.md` when complete unless a reviewer owns it.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- package.json scripts/get-last-commit-date.js scripts/generate-blur-placeholders.js lib/last-commit-date.json lib/image-blur-data.json components/intro-section.tsx README.md`

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-restore-verification-baseline.md`
- **Category**: tech-debt
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

The visible date is now explicit tracked content metadata, while Git-derived updates and blur regeneration are maintainer-only commands that write only when content changes. Ordinary development and production builds only read the tracked artifacts. The date fixture mode covers Git present, Git absent, unchanged output, and invalid explicit dates; the dev smoke and two consecutive builds preserved the complete working-tree status.

## Why this matters

Starting development and building currently rewrite tracked files under `lib/`. This creates unrelated diffs, makes read-only verification impossible, and causes source archives without Git metadata to display the build date as if it were a content update. Builds need a documented, deterministic input contract.

## Current state

- `package.json:6-7` runs both generators before build and the commit-date generator before dev.
- `scripts/get-last-commit-date.js:7-22` reads the latest repository commit then writes `lib/last-commit-date.json`; its fallback writes the current date at lines 24-35.
- `scripts/generate-blur-placeholders.js:76-87` always rewrites `lib/image-blur-data.json`.
- `components/intro-section.tsx:13-14` imports the tracked date JSON at module load.
- README describes generation as an automatic prebuild workflow at `README.md:85-93,138-147`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Baseline | `npm run check` | exit 0 |
| Build | `npm run build` | exit 0 |
| Dirt check | `git status --short` | identical before and after build/dev smoke check |

## Scope

**In scope**: `package.json`, both scripts, both generated JSON files and their import path if necessary, `components/intro-section.tsx`, `.gitignore`, and README generation/deployment sections.

**Out of scope**: changing visible bio copy, image-preload behavior, portfolio project data, framework upgrades, or committing generated cache output.

## Git workflow

- Branch: `codex/002-deterministic-generation`
- Commit message: `Make generated metadata deterministic`

## Steps

### Step 1: Define the update-date contract

Treat the displayed date as a content revision, not build time. Prefer an explicit tracked value owned with portfolio content or a deployment-provided revision value; never fall back silently to today's date. Remove `predev` mutation. If Git-derived automation remains available, expose it as an explicit maintainer command that writes only when intentionally invoked.

**Verify**: `npm run dev -- --help >/dev/null` followed by `git status --short` → no additional modified tracked file. Do not leave a dev server running.

### Step 2: Separate placeholder generation from ordinary verification

Make blur generation an explicit content-maintenance command or write its result to an ignored build cache consumed safely by the app. If the tracked JSON remains the runtime artifact, only rewrite it when serialized content actually differs and remove unconditional generation from `prebuild`. Preserve the existing `generate-blur` entry point.

**Verify**: record `git status --short`, run `npm run build`, then compare status → no new or changed tracked file; build exits 0.

### Step 3: Document the lifecycle

Update README to state what “Updated” means, when maintainers regenerate blur data, which artifacts are tracked or ignored, and which command is safe for CI.

**Verify**: `rg -n "Updated|generate-blur|npm run build" README.md` → all three concepts are documented accurately.

## Test plan

Add a small Node-level test only if Plan 004 has already introduced a runner; otherwise create a shell-verifiable fixture mode for the date script. Cover Git metadata present, missing metadata, unchanged output, and invalid explicit dates.

## Done criteria

- [x] Two consecutive `npm run build` executions exit 0 without changing tracked files.
- [x] Starting the dev command no longer rewrites tracked JSON.
- [x] No fallback presents current build day as content revision.
- [x] `npm run check` and `git diff --check` exit 0.

## STOP conditions

- Vercel deployment requires a generated module inside `lib/` and no ignored/output alternative can be imported.
- The intended meaning of the visible date cannot be established from repository context; report the available contracts for owner selection.
- Build changes any unrelated tracked file.

## Maintenance notes

Plan 011 will unify and validate image metadata; avoid designing its manifest here. Review deployment previews for stable displayed dates across rebuilds.
