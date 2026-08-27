# Gallery and lightbox behavior

The gallery consumes complete `GalleryImage` values from `lib/portfolio-view-model.ts`. UI code never joins folders, normalizes alternate paths, or casts blur-map keys.

## Responsive policy

- Below 620px, each card is 90% of the carousel container, remains draggable and vertically scrollable, and does not open a lightbox.
- At and above 620px, cards are full container width and each image is a named button.
- CSS owns card width. One `ResizeObserver` watches wrapper and track dimensions, computes the drag range, and clamps the current position after shrink/orientation changes.
- Horizontal touch intent is contained; vertical intent remains native page scrolling.

## Priority and intent preload

`Home` remains the sole owner of the measured LCP choice. Only the first image of `neutron-rebrand` receives initial preload/high priority; other thumbnails remain lazy.

Desktop hover, focus, open, and index changes call `preloadLightboxImages`. It requests only the selected image and wrapped immediate neighbors, deduplicates one/two-image galleries, and uses Next `getImageProps` at quality 95 so the resource hint matches the optimized rendered URL. Whole-gallery raw idle preload is prohibited.

## Native dialog lifecycle

`ImageLightbox` renders a native `<dialog>` with `showModal()`, gaining the browser top layer and background inertness. The feature controller still guarantees product-specific behavior:

- visible close-button initial focus and exact connected-opener restoration;
- prior inline `body` overflow restoration;
- contained Tab order across close, previous, image choices, and next;
- wrapped ArrowLeft/ArrowRight plus Home/End; modifier shortcuts are ignored;
- backdrop, Escape, and close-button dismissal;
- polite current-position and failure announcements;
- controls remain operable after image failure.

Normal entry pairs dialog content and `::backdrop` at 220ms ease-out. Exit pairs them at 176ms (20% faster). Only opacity and transform animate. Reduced motion closes immediately and disables dialog, backdrop, image, and control transitions.

## Image state

`LightboxImageFrame` is keyed by canonical `src` and models mutually exclusive `loading`, `loaded`, and `error` states. Blur data comes directly from the image value. A successful request fades in; a failed request announces its project/index while all navigation remains available. Navigating creates a fresh state boundary, so late events from an old source cannot overwrite the current image.

## Verification

- `tests/unit/draggable-carousel.test.tsx`: breakpoint policy, opener semantics, drag latch, CSS/observer surface, touch intent, and LCP preload forwarding.
- `tests/unit/image-lightbox.test.tsx`: native modal semantics, focus cycle/restoration, keyboard navigation, optimizer preload identity, failure recovery, and stale-event isolation.
- `tests/e2e/image-priority.spec.ts`: the single initial preload at mobile and desktop widths.
- `tests/e2e/interactions.spec.ts`: production drag/touch, dialog, accessibility, preload, resize, and failure behavior.

Run `npm run check` for every gallery change and `npm run test:e2e` for browser input, loading, priority, modal, or accessibility changes.
