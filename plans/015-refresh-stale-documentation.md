# Plan 015: Archive stale reviews and document the current system

> **Executor instructions**: Execute after functional plans that change the documented areas. Document stable intent and commands, not fragile copied line ranges.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- README.md CODEBASE_REVIEW.md LOADING_ANIMATION_TIMELINE.md IMAGE_LIGHTBOX_DOC.md app components lib scripts package.json`

## Status

- **State**: DONE
- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-restore-verification-baseline.md`, `plans/002-make-generation-non-dirtying.md`, `plans/005-stop-raw-image-preloading.md`, `plans/008-centralize-public-metadata.md`, `plans/011-unify-project-image-manifest.md`
- **Category**: docs
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

The README now documents the repository's passing commands, deterministic tracked artifacts, validated project manifest, typed metadata routes, intro behavior, and current gallery contract. The old codebase review is a dated archive marker; the animation and lightbox files now describe current symbols without copied line positions. Every documented command passed, including the production browser suite with 33 passes and three intentional environment skips. Generation and builds preserved tracked artifact hashes and working-tree status. Required and extended stale scans, local link/path checks, formatting, `npm run check`, and `git diff --check` passed; ESLint reports the existing four warnings and no errors.

## Why this matters

Current docs direct maintainers toward deleted word-animation code, describe two paragraphs instead of three, claim SEO is missing when it exists, and report zero linter errors while lint cannot start. Incorrect docs are actively harmful to agents and maintainers.

## Current state

- `LOADING_ANIMATION_TIMELINE.md:10-39,80-180` documents two word-by-word paragraphs and an `AnimatedText` implementation no longer present.
- `components/intro-section.tsx:34-43,152-179` now uses three visual-line-split paragraphs.
- `CODEBASE_REVIEW.md:326-332` says OG/Twitter/JSON-LD metadata is missing, while `app/layout.tsx:37-117,130-192` implements it.
- `CODEBASE_REVIEW.md:393-399` claims zero linter errors.
- `README.md:65-83,144-164` documents old animation timing, mutating prebuild behavior, and incorrectly calls lint a TypeScript check.
- `IMAGE_LIGHTBOX_DOC.md` is untracked and line-number-heavy; reconcile it with the post-plan component before adopting it as current documentation.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Link/code scan | `rg -n "AnimatedText|word-by-word|yourdomain|Linter Errors.*0|next lint" README.md CODEBASE_REVIEW.md LOADING_ANIMATION_TIMELINE.md IMAGE_LIGHTBOX_DOC.md` | no live-doc stale claims |

## Scope

**In scope**: the four named Markdown files and README documentation for current scripts, architecture, animation intent, metadata, image workflow, and verification.

**Out of scope**: source changes, product-direction documentation, inventing performance numbers, or preserving historical reviews as if they were current guidance.

## Git workflow

- Branch: `codex/015-current-documentation`
- Commit message: `Refresh portfolio documentation`

## Steps

### Step 1: Classify documents

Mark `CODEBASE_REVIEW.md` as a historical snapshot with its commit/date and a prominent non-current notice, or move its still-valid conclusions into README and remove it. Apply the same rule to any historical timeline that should not be maintained.

**Verify**: no historical claim is presented as current without a revision marker.

### Step 2: Rewrite current operational guidance

Document exact passing commands from Plan 001, deterministic generation from Plan 002, one-source content workflow from Plan 011, and current metadata routes from Plan 008. Replace destructive troubleshooting (`rm -rf node_modules`) with targeted diagnostic steps.

**Verify**: a fresh reader can find install, dev, check, test, build, content-validation, and blur-generation commands with expected purpose.

### Step 3: Document animation/lightbox intent

Describe the three-paragraph line animation, reduced-motion behavior, timing ownership in constants, gallery preload policy, keyboard/modal behavior, and error handling at the symbol level. Avoid copied code blocks and fixed line numbers that drift quickly.

**Verify**: stale-pattern scan returns no matches; all referenced paths exist.

## Test plan

No new runtime tests. Run documentation link/path checks if available and manually execute every documented command once in order.

## Done criteria

- [x] Historical reviews are clearly archived or removed.
- [x] README commands match `package.json` and pass.
- [x] Animation and lightbox docs describe current symbols/behavior.
- [x] No stale SEO, lint, or two-paragraph claims remain in live docs.
- [x] Only documentation and plan-index status changed.

## STOP conditions

- A depended-on functional plan is incomplete; postpone the affected section rather than documenting the planned state as current.
- The owner wants historical files preserved without an archive marker.
- A documented command does not pass; fix its owning plan, not the prose.

## Maintenance notes

Prefer rationale, ownership, and commands over copied implementations. Date/commit-stamp one-off reviews so they cannot masquerade as evergreen guidance.
