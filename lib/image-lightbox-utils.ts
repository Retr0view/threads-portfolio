/**
 * Image lightbox utility functions
 * Helper functions for lightbox image positioning and animations
 */

/**
 * Calculates the transform origin for lightbox image animation
 * based on the clicked image's position relative to the viewport center.
 * This creates a smooth zoom effect from the clicked image's position.
 * 
 * @param clickedImageRect - The bounding rectangle of the clicked image
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns Transform origin string in format "X% Y%" or "center center" if reduced motion
 * 
 * @example
 * const rect = clickedImage.getBoundingClientRect()
 * const transformOrigin = calculateTransformOrigin(rect, false)
 * // Returns something like "45% 60%" based on image position
 */
export function calculateTransformOrigin(
  clickedImageRect: DOMRect | null,
  prefersReducedMotion: boolean
): string {
  if (prefersReducedMotion || !clickedImageRect) {
    return "center center"
  }
  
  const centerX = clickedImageRect.left + clickedImageRect.width / 2
  const centerY = clickedImageRect.top + clickedImageRect.height / 2
  const viewportCenterX = window.innerWidth / 2
  const viewportCenterY = window.innerHeight / 2
  
  // Calculate percentage from viewport center
  const originX = ((centerX - viewportCenterX) / window.innerWidth) * 100 + 50
  const originY = ((centerY - viewportCenterY) / window.innerHeight) * 100 + 50
  
  return `${originX}% ${originY}%`
}



