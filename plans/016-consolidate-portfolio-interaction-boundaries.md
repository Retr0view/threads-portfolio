# Plan 016: Consolidate portfolio and interaction boundaries

> **Executor instructions**: Preserve the characterized product contracts while deleting duplicated representation, timing, and lifecycle state. Execute each slice to a green verification boundary before continuing.
>
> **Drift check (run first)**: `git diff --stat 823ec32..HEAD -- app components lib scripts tests package.json tailwind.config.ts`

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/004-add-interaction-characterization-tests.md`, `plans/005-stop-raw-image-preloading.md`, `plans/007-make-gallery-keyboard-accessible.md`, `plans/010-render-lightbox-image-errors.md`, `plans/011-unify-project-image-manifest.md`, `plans/012-reserve-image-priority-for-lcp.md`
- **Category**: architecture, accessibility, motion, content
- **Reviewed at**: commit `823ec32`, 2026-08-26
- **Completed on**: 2026-08-26
- **Source**: pstack maintainability review, source-history archaeology, and two independent architecture candidates

## Outcome

Give React one canonical, safe portfolio view model; give each interaction one owner; replace runtime state with platform/CSS behavior where no user state exists; and remove legacy utilities and dependencies after callers migrate.

## Findings recorded

1. **Project data crosses too many representations.** A JSON manifest, CommonJS validator, hand-maintained declaration, lossy `WorkGroup`, path joining, and blur-map casting jointly describe one domain.
2. **Descriptions bypass React safety.** Static HTML is rendered with `dangerouslySetInnerHTML`; structured text/link parts express the actual content without an HTML injection boundary.
3. **Gallery images are incomplete values.** Components receive filenames plus a folder and rediscover `src` and blur metadata. They should receive complete `{ id, src, blurDataURL }` objects.
4. **Carousel layout has redundant observers.** React width state, a debounced window listener, `ResizeObserver`, and breakpoint state all react to the same resize. CSS should own card width; one observer should own drag constraints and clamping.
5. **The lightbox reimplements platform modal behavior.** Custom focus trapping, global keyboard listeners, body locking, hover state, and parallel open/index state obscure the product contract. A feature-local native dialog can own top-layer and focus containment while retaining explicit navigation, restoration, preload, and image-state behavior.
6. **System-only theme has unnecessary runtime state.** `next-themes`, storage deletion, hydration suppression, and wrapper components implement `prefers-color-scheme`; CSS media tokens and Tailwind media mode are sufficient.
7. **Intro sequencing guesses completion.** CSS, the split-lines hook, constants, and the page duplicate timing and expose a `2.2s` boundary. The measured line sequence should report actual first-run completion.
8. **Scroll-to-top exposes its state machine to the page.** Lenis subscription, a shared motion value, latch, temporary padding, timers, and avatar reset span modules without one guaranteed finalizer.
9. **Dead scaffolding weakens the verification signal.** Unused resize/debounce hooks, `@unpic/react`, duplicated blur keys, stale comments/docs, and warning-tolerant lint should be removed after migration.

## Preserved contracts

- One runtime-neutral, fail-closed manifest remains usable by Next and Node tooling; project/image order, path validation, duplicate detection, asset existence, and exact blur coverage remain enforced.
- Mobile cards remain 90% width below 620px and full width at/above 620px. Mobile remains draggable and vertically scrollable, with no lightbox. Drag constraints remain valid after layout and orientation changes.
- The page owns the single LCP preload choice. Lightbox intent preload uses Next optimizer URL identity for the selected image and immediate neighbors only.
- The modal remains named, announces position/failure, restores the exact opener, restores prior body overflow, supports wrapped arrows plus Home/End, remains operable after image failure, and exposes controls without hover at constrained desktop widths.
- Intro text remains three semantic paragraphs in OpenRunde, with the existing readable measure and `1.5` line-height. It waits for font readiness, re-splits after resize without replay, and completes immediately under reduced motion.
- Back-to-top retains the down-overshoot, spring arrival, and near-arrival avatar cue for normal motion. Reduced motion performs an immediate scroll and no cue.
- All new motion follows the animation guideline: transform/opacity only, paired modal/backdrop timing, exit about 20% faster, and no animation or transition under reduced motion.

## Architecture decision

Adopt the feature-local candidate with one narrow React view-model adapter:

```text
validated manifest + canonical blur map
                 ↓
       PortfolioProjectView[]
                 ↓
 WorkGroup → feature-local gallery/dialog
```

Keep raw manifest/filesystem tooling separate from React. The adapter is the only representation-changing boundary. Components receive complete values and own their local interaction lifecycle. Prefer native `<dialog>`, responsive CSS, media theme tokens, `matchMedia`, and actual completion events. Do not introduce a global portfolio repository or programmable animation timeline; those add an abstraction layer without a second consumer.

### Rejected alternatives

- A central compiled repository coupled UI, filesystem validation, blur generation, and performance policy behind one broad owner.
- A central animation timeline still predicts browser wrapping and leaks sequencing protocol to every caller.
- A headless dialog dependency duplicates native capabilities for one viewer.
- Rendering both mobile and desktop gallery markup risks duplicate image requests and accessibility ambiguity.

## Execution slices

### 1. Canonical content boundary

- Convert descriptions to validated structured parts.
- Type the runtime validator without a hand-maintained declaration.
- Add the UI view model and canonical leading-slash blur lookup.
- Migrate `WorkGroup` and carousel callers; delete legacy path/HTML adapters and duplicate blur keys.

**Verify**: manifest unit tests, content validation, exact expected paths, and blur generation idempotence.

### 2. Runtime-free theme and typography guardrails

- Move dark tokens under `prefers-color-scheme`, switch Tailwind to media mode, and remove `ThemeInit`, `ThemeProvider`, `next-themes`, storage writes, and hydration suppression.
- Keep OpenRunde WOFF2 loading and weights; set `font-synthesis: none`; retain the intro measure and unitless `1.5` leading.

**Verify**: typecheck, unit tests, build, and both emulated color schemes.

### 3. Atomic scroll and explicit intro completion

- Move the entire back-to-top operation into one hook with an idempotent finalizer for success, interruption, dependency replacement, and unmount.
- Make reduced motion immediate.
- Make split lines report actual first-run completion; reveal social links and projects from that signal and remove guessed global timing.

**Verify**: success/re-entry/unmount/reduced-motion tests; font-ready and resize/no-replay tests.

### 4. CSS carousel and native dialog

- Move card sizing to responsive CSS; keep `matchMedia` only for semantic desktop/mobile rendering.
- Use one observer for track/wrapper constraints and clamp position after shrink.
- Encapsulate gallery selection and modal state; use native dialog for top layer/focus containment and retain explicit product navigation, preload, failure, overflow, and opener-restoration behavior.
- Pair backdrop/content animation and fully disable it for reduced motion.

**Verify**: carousel/lightbox unit tests, touch/resize browser tests, keyboard/focus/error/preload browser tests.

### 5. Subtract and document

- Replace `@unpic/react` with `next/image`; remove dead hooks, stale constants/utilities/comments, and unused dependencies.
- Make lint fail on warnings and update current gallery/animation/README documentation.

## Verification contract

Run after the owning slice and again at completion:

```sh
npm run validate-content
npm run check
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check
git status --short
```

Generation and production builds must leave tracked artifacts unchanged.

## Done criteria

- [x] One UI model provides structured descriptions and complete gallery images.
- [x] No UI caller joins image paths, casts blur keys, or injects HTML.
- [x] Theme behavior is CSS-only and system-only.
- [x] Intro completion is event-driven and scroll-to-top has one lifecycle owner.
- [x] Carousel has one layout observer and no JS card-width state.
- [x] Native dialog preserves all characterized modal, preload, and error contracts.
- [x] Reduced-motion behavior disables every affected animation/transition.
- [x] OpenRunde metrics, semantic hierarchy, measure, and leading remain stable.
- [x] Dead utilities/dependencies are removed and lint has zero warnings.
- [x] Full verification passes without dirtying tracked generated files.

## STOP conditions

- Native dialog cannot preserve exact opener focus, keyboard navigation, or constrained-screen controls in a supported browser.
- CSS sizing cannot preserve both the 90% mobile card and post-resize drag constraints.
- Structured content or validator changes weaken fail-closed validation or Node/Next interoperability.
- Event-driven intro completion replays after font/resize re-splitting.
- A refactor would restore raw whole-gallery preloading or add a second LCP-priority image.
