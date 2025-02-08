import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes and handles conditional class names.
 * @param inputs - Class names or conditional class objects.
 * @returns A merged string of class names.
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}