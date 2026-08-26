# Plan 008: Centralize and correct public portfolio metadata

> **Executor instructions**: Keep the long-form page bio and concise metadata intentionally distinct. Verify generated head and crawler routes before completion.
>
> **Drift check (run first)**: `git diff --stat 2699551..HEAD -- components/intro-section.tsx lib/site-config.ts app/layout.tsx app/sitemap.ts public/manifest.json public/robots.txt`

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-restore-verification-baseline.md`
- **Category**: docs
- **Planned at**: commit `2699551`, 2026-08-22
- **Completed on**: 2026-08-26

The concise description now has one owner in `siteConfig`, while the supplied long-form bio remains page-only. Typed metadata routes generate the manifest and robots response, and the sitemap uses Plan 002's explicit content-revision value. The production head/route test, `npm run check`, `npm run build`, and the consecutive-build sitemap comparison pass. Plan 004 has not yet added the repository test runner, so the focused Node test is run directly until it can be integrated into `npm test`.

## Why this matters

The visible positioning now emphasizes designing in code, founder/startup work, and craft, while search/social/install metadata still uses the old sentence. `robots.txt` also advertises a placeholder sitemap domain. Public discovery surfaces should be accurate and owned from one configuration boundary.

## Current state

- `components/intro-section.tsx:16-20` contains the new three-paragraph bio.
- `lib/site-config.ts:8-11` owns title, old concise description, canonical URL, and OG image.
- `app/layout.tsx:37-117,130-192` correctly reuses `siteConfig.description` across metadata and JSON-LD.
- `public/manifest.json:4` duplicates the old description.
- `public/robots.txt:8` points to `https://yourdomain.com/sitemap.xml`.
- `app/sitemap.ts:8` reports `new Date()` on every generation rather than a content revision.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `npm run check` | exit 0 |
| Build | `npm run build` | exit 0 |
| Inspect | `curl -fsS http://localhost:3000/robots.txt` | canonical sitemap URL present |

## Scope

**In scope**: the six listed metadata/bio/crawler files and focused metadata tests.

**Out of scope**: rewriting the user's supplied long-form bio, new SEO keywords, new OG artwork, domain migration, or adding marketing claims not present in the portfolio.

## Git workflow

- Branch: `codex/008-public-metadata`
- Commit message: `Synchronize portfolio metadata`

## Steps

### Step 1: Define one concise machine-readable description

Derive a search/social-length summary from the supplied bio that preserves “design in code,” senior product design, founders/startups, and craft without copying all three paragraphs. Store it in `siteConfig.description`; keep long-form bio page-only.

**Verify**: metadata tests assert title and new description in Open Graph, Twitter, and JSON-LD.

### Step 2: Remove static metadata duplication

Prefer an App Router `manifest.ts` and `robots.ts` driven from `siteConfig`, or another single-source mechanism supported by the installed Next version. Remove superseded static files only after generated routes are verified. Use `siteConfig.url` for the sitemap URL.

**Verify**: production server returns valid `/manifest.webmanifest`, `/robots.txt`, and `/sitemap.xml` with the canonical domain and no `yourdomain.com`.

### Step 3: Give sitemap an honest revision date

Use the explicit content-revision contract from Plan 002 or omit `lastModified`; do not emit request/build time as content change.

**Verify**: two builds without content changes emit the same sitemap revision value.

## Test plan

- Add route/metadata tests for canonical URL, concise description, Open Graph, Twitter, JSON-LD, manifest, robots sitemap directive, and sitemap revision stability.
- Add an assertion that neither the old description nor `yourdomain.com` appears in built public output.
- Use the metadata test setup from Plan 004 if present; do not call external preview validators from unit tests.
- Verification: `npm run test -- metadata && npm run build` pass.

## Done criteria

- [x] No old metadata sentence remains outside archived docs.
- [x] No placeholder domain remains in public crawler output.
- [x] Head, manifest, JSON-LD, robots, and sitemap agree on canonical identity.
- [x] `npm run check` and `npm run build` pass.

## STOP conditions

- Production canonical domain differs from `siteConfig` and cannot be resolved from deployment config.
- Next's route generators conflict with existing public static files after documented migration steps.
- Copy change would alter the long-form bio rather than its concise summary.

## Maintenance notes

Document the distinction between long bio and concise metadata. Future positioning updates should have one checklist-backed owner.
