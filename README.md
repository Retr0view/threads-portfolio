# Portfolio site

This repository contains Rian Touag's portfolio. It is a Next.js App Router application with TypeScript, React, Tailwind CSS, Framer Motion, Lenis, and `next/image`.

## Run the site locally

Use Node.js 24 to match the continuous-integration workflow. Install the locked dependency tree, then start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Development and production builds read tracked content artifacts. They do not regenerate those files or change the visible content revision.

## Command reference

Run these commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm run check` | Run TypeScript, ESLint, the deterministic date-script fixture, and the unit suite. |
| `npm run test` | Run the Vitest unit suite. |
| `npm run test:e2e` | Build the production application and run the Playwright suite in Chromium and WebKit. |
| `npm run build` | Create a production build without rewriting tracked content files. |
| `npm run validate-content` | Validate the project manifest, public assets, and exact blur-placeholder coverage. |
| `npm run generate-blur` | Regenerate tracked blur data after a portfolio image change. It writes only when output changes. |
| `npm run update-content-date -- --date YYYY-MM-DD` | Record an intentional portfolio content revision. Supply a real calendar date. |
| `npm run typecheck` | Run the TypeScript checker without incremental output. |
| `npm run lint` | Run ESLint across the repository. |
| `npm ls --depth=0` | Inspect the installed top-level dependency tree. |

`npm run check` is the normal local and CI gate. Content changes also need `npm run validate-content`. Interaction or image-loading changes need `npm run test:e2e`.

## Source layout

```text
app/
  layout.tsx                     Root metadata and application providers
  page.tsx                       Home-page composition and image-priority choice
  manifest.ts                    Web app manifest route
  robots.ts                      Crawler rules route
  sitemap.ts                     Sitemap route
components/
  draggable-carousel.tsx         Responsive gallery and lightbox opener
  image-lightbox.tsx             Modal viewer, image loading, and navigation
  intro-section.tsx              Profile, biography, and intro timing
  work-group.tsx                 Project header and gallery boundary
lib/
  project-image-manifest.json    Project and image content source
  project-image-manifest.js      Runtime-neutral manifest validation
  work-groups.ts                 Typed UI projection of the manifest
  image-blur-data.json           Tracked generated blur placeholders
  last-commit-date.json          Tracked content revision
  site-config.ts                 Canonical public identity and social links
scripts/
  validate-content.js            Repository content validation entry point
  generate-blur-placeholders.js  Blur-data generator
  get-last-commit-date.js        Explicit content-date updater and fixture
tests/
  unit/                          Vitest component and utility coverage
  e2e/                           Playwright production-browser coverage
```

## Update portfolio content

`lib/project-image-manifest.json` is the only project and gallery manifest. Each entry owns its project ID, copy, logo path, image folder, ordered image filenames, and optional fallback. `lib/work-groups.ts` derives the UI data from the validated manifest. The blur generator reads the same source.

When adding, removing, renaming, or replacing a project image:

1. Update `lib/project-image-manifest.json` and the matching asset under `public/`.
2. Run `npm run generate-blur`. The generator validates the manifest and source assets before refreshing `lib/image-blur-data.json`.
3. Run `npm run validate-content` to prove the final manifest, assets, and exact blur coverage agree.
4. Update the tracked content date with `npm run update-content-date -- --date YYYY-MM-DD`.
5. Run `npm run check` and `npm run build` before committing the changed content and generated files together.

The date shown as `Updated` is the portfolio content revision, not a build or deployment timestamp. Calling the date command without `--date` derives the latest Git commit date. It requires Git metadata and fails if that metadata is unavailable; it never substitutes the current day.

## Public metadata

`lib/site-config.ts` owns the canonical site URL, title, concise public description, social image, language, and social links. `app/layout.tsx` consumes it for standard metadata, Open Graph, Twitter cards, canonical links, icons, and JSON-LD. The typed App Router files expose:

- `/manifest.webmanifest` from `app/manifest.ts`
- `/robots.txt` from `app/robots.ts`
- `/sitemap.xml` from `app/sitemap.ts`

`app/sitemap.ts` uses `lib/last-commit-date.json`, so rebuilding unchanged content does not publish a new revision date. `NEXT_PUBLIC_SITE_URL` may override the canonical URL for a deployment. `NEXT_PUBLIC_GOOGLE_VERIFICATION` is optional.

## Intro animation

The biography contains three paragraphs. `useSplitLines` measures their browser-wrapped visual lines and animates each paragraph once. Font readiness and resize events trigger a fresh measurement without replaying a completed entrance. Reduced-motion users receive the completed state immediately.

The overall sequence is coordinated through symbols in `lib/constants.ts` and `BIO_ANIMATION_END` in `components/intro-section.tsx`. See [LOADING_ANIMATION_TIMELINE.md](LOADING_ANIMATION_TIMELINE.md) for ownership and sequencing details.

## Gallery and lightbox

The page chooses one measured portfolio LCP image for initial preload. Other carousel images remain lazy. Desktop hover, focus, open, and lightbox navigation request optimized current and adjacent images without fetching every original on idle.

At the desktop breakpoint, each image is a named button that opens a modal dialog. The dialog traps keyboard focus, restores focus to its exact opener, supports keyboard and pointer navigation, preserves the prior body-overflow value, and keeps controls available after an image failure. On mobile, the carousel remains draggable but its images do not become buttons or open the lightbox.

See [IMAGE_LIGHTBOX_DOC.md](IMAGE_LIGHTBOX_DOC.md) for the complete interaction, preload, reduced-motion, and error-state contracts.

## Targeted diagnostics

Do not delete the lockfile, dependency tree, or build output as a first response to a failure. Start with the smallest command that owns the failing boundary:

- Dependency installation: inspect `npm ci` output, then run `npm ls --depth=0`.
- Type diagnostics: run `npm run typecheck`.
- Lint diagnostics: run `npm run lint`.
- Unit failures: run `npm run test` and use Vitest's reported test path.
- Browser failures: run `npm run test:e2e` and inspect the Playwright trace named in its output.
- Content failures: run `npm run validate-content`; its messages identify the invalid manifest field, project asset, or blur key.
- Production failures: run `npm run check`, then `npm run build` and address the first reported error.

## Historical maintenance records

`CODEBASE_REVIEW.md` is an archive marker for the review that preceded the current maintenance plans. [plans/README.md](plans/README.md) is the implementation record and status index for that work.
