# Plan 001: Restore a trustworthy verification baseline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. If a STOP condition occurs, stop and report; do not improvise. When done, update this plan's row in `plans/README.md` unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- package.json package-lock.json eslint.config.mjs prettier.config.mjs stylelint.config.mjs components/intro-section.tsx lib/hooks/use-split-lines.ts .github/workflows/check.yml`
> If an in-scope file changed, compare it with Current state before proceeding. A mismatch is a STOP condition.

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

The user-approved unblock replaced the incompatible Ultracite ESLint presets with Next.js's maintained flat configs while retaining Ultracite for the shared formatter and style tooling. TSX now uses the TypeScript parser and JSON uses a dedicated syntax parser. The final lint gate has no errors and six pre-existing warnings: five unused bindings and one hook dependency warning.

## Why this matters

No current command proves that the repository is healthy. `npm run lint` invokes removed Next.js 16 behavior, the new lint configs import an undeclared package, and TypeScript reports six errors. Every later plan needs a stable, one-command gate so regressions are distinguishable from existing failures.

## Current state

- `package.json:5-12` contains `"lint": "next lint"` and no `typecheck` or `check` script.
- `eslint.config.mjs:1-7`, `prettier.config.mjs:1`, and `stylelint.config.mjs:1` import `ultracite`, but `package.json:29-38` does not declare it.
- `components/intro-section.tsx:34-43` passes React 19 nullable refs to `useSplitLines`.
- `components/intro-section.tsx:96-99` mixes `window.setTimeout` numeric handles with the Node-flavored global return type.
- `lib/hooks/use-split-lines.ts:20-22,32,78-83` has the matching ref and timer type errors.
- Conventions: strict TypeScript, extensionless `@/` imports, no semicolons in existing source, and imperative commit messages such as `Fix TypeScript error in useResizeObserver`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm install` | exit 0 and lockfile synchronized |
| Typecheck | `npm run typecheck` | exit 0, no errors |
| Lint | `npm run lint` | exit 0 |
| Full gate | `npm run check` | exit 0 |

## Scope

**In scope**: `package.json`, `package-lock.json`, the three root tool configs, `components/intro-section.tsx`, `lib/hooks/use-split-lines.ts`, and a new `.github/workflows/check.yml`.

**Out of scope**: tests, production dependencies other than the lint-config package, application behavior, formatting the whole repository, and generated JSON.

## Git workflow

- Branch: `codex/001-verification-baseline`
- Commit message: `Restore verification baseline`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Make the toolchain internally consistent

Keep the evident Ultracite approach: add a compatible `ultracite` dev dependency, retain the three configs, change `lint` to `eslint .`, and add `typecheck: "tsc --noEmit --incremental false"` plus `check: "npm run typecheck && npm run lint"`. Use `npm install --save-dev ultracite` so manifest and lockfile remain synchronized.

**Verify**: `npm ls ultracite && npm run lint` → Ultracite resolves and ESLint runs rather than failing module resolution or treating `lint` as a directory.

### Step 2: Resolve the six type errors without behavior changes

Make `useSplitLines` accept `React.RefObject<HTMLParagraphElement | null>`. Use browser-compatible numeric timer handles in the hook and intro component (`number | undefined` / `number[]`) wherever the handle comes from `window.setTimeout`. Do not refactor animation logic.

**Verify**: `npm run typecheck` → exit 0 with no diagnostics.

### Step 3: Add the first CI gate

Create a minimal GitHub Actions workflow triggered on pull requests and pushes that checks out the repo, sets up the Node version declared by the executor in the workflow, runs `npm ci`, then `npm run check`. Prefer current Node LTS and npm cache support. Do not run `npm run build` yet; Plan 002 first removes tracked-source writes from builds.

**Verify**: `rg -n "npm ci|npm run check" .github/workflows/check.yml` → both commands appear exactly once; `npm run check` exits 0 locally.

## Test plan

This plan establishes static gates only; do not add a test runner. Verify the former six diagnostics are absent and deliberately run `npm run lint -- --version` only if needed to prove ESLint receives arguments correctly.

## Done criteria

- [x] `npm run typecheck`, `npm run lint`, and `npm run check` exit 0.
- [x] `npm ls ultracite` exits 0.
- [x] CI runs `npm ci` followed by `npm run check`.
- [x] `git diff --check` exits 0.
- [x] No file outside Scope changed, except `plans/README.md` status.

## STOP conditions

- Ultracite's compatible release requires changing the application framework or Tailwind major version.
- Lint surfaces more than 25 application diagnostics; report the list rather than sweeping unrelated source.
- Type errors remain outside the two named source files.

## Maintenance notes

Plan 004 will extend `check` with tests. Reviewers should reject broad formatting churn or behavior changes hidden inside this baseline repair.
