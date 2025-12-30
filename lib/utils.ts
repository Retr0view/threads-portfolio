import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and twMerge to resolve conflicts
 * 
 * @param {...ClassValue} inputs - Class names or conditional class objects
 * @returns {string} Merged class string
 * 
 * @example
 * cn("px-4", "py-2", isActive && "bg-blue-500")
 * cn("px-4 py-2", "px-6") // Resolves to "py-2 px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}















