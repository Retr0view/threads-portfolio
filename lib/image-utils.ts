/**
 * Image path utilities
 * Normalizes image paths for consistent handling across the application
 */

/**
 * Normalizes an image path by ensuring it's either a full path (starts with /) 
 * or a relative path within the specified folder
 * 
 * @param path - Image path (may or may not start with /)
 * @param folder - Folder path to prepend if path doesn't start with /
 * @returns Normalized image path
 * 
 * @example
 * normalizeImagePath("image.jpg", "/images/folder") // "/images/folder/image.jpg"
 * normalizeImagePath("/images/folder/image.jpg", "/images/folder") // "/images/folder/image.jpg"
 */
export function normalizeImagePath(path: string, folder: string): string {
  return path.startsWith("/") ? path : `${folder}/${path}`
}



