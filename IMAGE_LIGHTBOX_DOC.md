# Gallery and lightbox behavior

This document explains the current gallery loading and interaction contract. The main implementation boundaries are `components/draggable-carousel.tsx`, `components/image-lightbox.tsx`, `components/work-group.tsx`, and `app/page.tsx`.

## Responsive interaction policy

`DraggableCarousel` uses `BREAKPOINTS.MOBILE` to choose the interaction surface.

- At and above the desktop breakpoint, each carousel image is a project-aware button. Pointer clicks are suppressed while the drag latch is active. Enter and Space still open the selected image if a previous pointer drag left a stale latch.
- Below the breakpoint, carousel items remain non-button images with descriptive alternative text. The carousel remains draggable, but the lightbox does not open on mobile under the current product policy.
- Horizontal pointer, wheel, and touch input moves the carousel within its measured constraints. Vertical touch intent remains available to the page.
- Resize observation recalculates the track width and drag range when the viewport or content dimensions change.

The desktop button owns the accessible name, so its nested thumbnail is decorative. The mobile image owns its own description because it is no longer inside an opener control.

## Initial image priority

Initial priority is a page-composition decision. `Home` compares each work group with `PORTFOLIO_LCP_WORK_GROUP_ID` and passes `preloadFirstImage` through `WorkGroup` to `DraggableCarousel`.

Only the first image of that measured LCP work group receives Next's `preload` behavior and high fetch priority. Other carousel images remain lazy. Changing project order, above-the-fold layout, or breakpoint behavior requires a new production measurement before changing this selection.

## Intent-based lightbox preload

`preloadLightboxImages` requests the selected image and its immediate previous and next neighbors. `getLightboxPreloadIndices` deduplicates wrapped indices, so one-image and two-image projects do not issue redundant requests.

Preload starts when a desktop opener receives hover or focus, immediately before open, and when the open lightbox index changes. The function:

1. Normalizes the manifest filename with its image folder.
2. Calls Next's `getImageProps` with the lightbox sizes and quality.
3. Passes the optimized `src`, `srcSet`, and `sizes` to React DOM's image preload API.

This keeps preload identity aligned with the optimized image that the dialog renders. The homepage does not fetch every gallery original during idle time.

## Open and close lifecycle

Opening records the exact opener and its viewport rectangle. The rectangle feeds `calculateTransformOrigin`, which makes normal-motion scaling originate near the selected thumbnail.

While open, `ImageLightbox`:

- renders a named element with `role="dialog"` and `aria-modal="true"`;
- moves focus to the visible close button;
- keeps Tab and Shift+Tab within close, previous, image-choice, and next controls;
- stores and restores the previous inline `body` overflow value;
- announces the current project image position through a polite status;
- restores focus to the exact opener when the dialog unmounts.

Backdrop clicks and the close button close the dialog. The image and its controls stop click propagation so a navigation action does not also close it.

## Navigation

The lightbox wraps at both ends.

| Input | Result |
| --- | --- |
| `Escape` | Close and return focus to the opener. |
| `ArrowLeft` | Show the previous image, wrapping to the last. |
| `ArrowRight` | Show the next image, wrapping to the first. |
| `Home` | Show the first image. |
| `End` | Show the last image. |
| Previous and next buttons | Apply the same wrapped navigation. |
| Image-choice buttons | Open the selected index and expose the active choice with `aria-current`. |

Modifier-key combinations are not treated as gallery shortcuts. Focus stays on the control that initiated navigation.

## Loading and failure states

`LightboxImageFrame` models `loading`, `loaded`, and `error` as mutually exclusive states for its `imageSrc`. The frame is keyed by the normalized source, so navigating creates a fresh state boundary for the next image and late events from an old image cannot replace it.

During loading, the tracked blur placeholder remains visible when coverage exists and the full image stays transparent. A successful load fades in the image and removes the blur. A failed load hides both indefinite loading layers and renders a polite status message that identifies the project and image position.

The close, previous, next, and image-choice controls sit outside the image state. They remain available after failure, so navigation is the recovery path. Returning to a failed source starts a new frame; there is no separate retry action with ambiguous browser-cache behavior.

## Reduced motion

Normal motion scales and fades the lightbox from a transform origin based on the opener rectangle. With reduced motion, `calculateTransformOrigin` returns the center and the image variants keep scale at its final value. A short opacity transition remains. Dialog semantics, focus management, navigation, preload, and error handling do not change.

## Verification boundaries

Current automated coverage includes:

- `tests/unit/draggable-carousel.test.tsx` for opener semantics, drag suppression, breakpoint policy, touch intent, and page-owned preload.
- `tests/unit/image-lightbox.test.tsx` for keyboard navigation, modal focus, exact focus restoration, preload indices, loading failures, recovery, and stale events.
- `tests/e2e/image-priority.spec.ts` for the single measured portfolio preload at mobile and desktop widths.
- `tests/e2e/interactions.spec.ts` for optimizer-backed intent requests, drag and touch behavior, keyboard-only dialog use, automated accessibility checks, and failure recovery.

Run `npm run check` after any gallery change. Also run `npm run test:e2e` when changing browser input, image loading, priority, dialog behavior, or accessibility state.
