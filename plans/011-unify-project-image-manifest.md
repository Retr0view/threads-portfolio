# Plan 011: Use one validated source for project image metadata

> **Executor instructions**: Migrate consumers in verifiable order: add the manifest, switch callers, validate, then delete duplicate data. Stop rather than maintaining compatibility copies.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- lib/work-groups.ts scripts/generate-blur-placeholders.js components/work-group.tsx components/draggable-carousel.tsx public/images public/logos tests`

## Status

- **State**: DONE
- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/002-make-generation-non-dirtying.md`, `plans/004-add-interaction-characterization-tests.md`
- **Category**: tech-debt
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

Project metadata now lives in one runtime-neutral JSON manifest. The UI derives its typed work groups from that validated source, while the blur generator and fail-closed content validator share the same image entries. Fixture tests cover schema, path, asset, fallback, ordered-path parity, and exact blur-key coverage; two consecutive generations were identical and the production build left the working tree unchanged.

## Why this matters

Project images are hand-copied in the UI module and blur generator. Renames can silently leave stale placeholders because missing inputs only warn, while every configured fallback currently points to a nonexistent file. Portfolio content maintenance needs one validated manifest.

## Current state

- `lib/work-groups.ts:1-10` defines the UI schema; lines 12-68 contain four projects and 11 images.
- `scripts/generate-blur-placeholders.js:5-38` duplicates image folders and filenames.
- The generator warns and continues for missing files at lines 55-72.
- `lib/work-groups.ts:25,39,53,66` repeats `/images/Neutron Rebrand/image 58.jpg`, which is absent from `public/`.
- `components/work-group.tsx:17-21` only uses fallback images when a project's image list is empty.

## Commands you will need

| Purpose  | Command                    | Expected on success                 |
| -------- | -------------------------- | ----------------------------------- |
| Gate     | `npm run check`            | exit 0                              |
| Validate | `npm run validate-content` | exit 0; all referenced assets exist |
| Generate | `npm run generate-blur`    | exit 0; complete coverage           |

## Scope

**In scope**: project/image manifest, both current consumers, content validator, fallback representation, manifest tests, and manifest-related package scripts.

**Out of scope**: rewriting project copy, adding projects/assets, case-study schema, image preloading, or renaming public assets solely for aesthetics.

## Git workflow

- Branch: `codex/011-project-manifest`
- Commit message: `Unify project image metadata`

## Steps

### Step 1: Create a runtime-neutral manifest

Choose JSON or a module format consumable without duplicating values by both Next TypeScript and the Node generator. Define project ID, name, company, description representation, logo path, image folder, ordered images, and optional valid fallback. Validate uniqueness and required fields at the boundary.

**Verify**: manifest schema tests cover duplicate IDs, empty names, and malformed paths.

### Step 2: Switch both consumers

Derive the exported typed `workGroups` and placeholder generation inputs from the manifest. Remove the script-local `workGroups` list after parity is proven.

**Verify**: a script compares manifest paths with current expected 11 image paths; `rg -n "const workGroups = \[" scripts/generate-blur-placeholders.js` returns no match.

### Step 3: Make validation fail closed

Add `validate-content` to check every logo, image, optional fallback, and generated blur key. Missing assets must fail with project ID and relative path. Replace invalid repeated fallbacks with a valid asset or make fallback absence explicit.

**Verify**: temporarily point a test fixture at a missing image → validator exits nonzero with project/path; restore fixture and command exits 0.

## Test plan

Test valid repository content, duplicate IDs, traversal/absolute filesystem paths, missing logos/images, empty image arrays with/without fallback, and blur coverage. Tests must use fixtures, never mutate `public/`.

## Done criteria

- [x] One manifest owns project/image paths.
- [x] All referenced production assets exist.
- [x] Missing content makes validation/generation fail nonzero.
- [x] `npm run check`, `npm run validate-content`, and generation pass.

## STOP conditions

- Sharing data requires importing browser-only code into the Node script.
- Moving descriptions would alter trusted HTML rendering or user-visible copy.
- A missing production asset has no owner-approved replacement; report it rather than inventing one.

## Maintenance notes

Run validation whenever project content changes. Plan 015 should document the one-source workflow after this lands.
