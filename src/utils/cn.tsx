import { clsx, type ClassValue } from 'clsx';
import { createCn } from './extend-merge';

/**
 * Merges Tailwind classes and handles conditional class names.
 *
 * Token-aware: the `a2z` design-token families are registered as merge groups
 * (see `extend-merge.ts`), so `cn('bg-primary-600', 'bg-red-500')` correctly
 * yields `bg-red-500`. With a bare `twMerge`, both classes survive and the
 * winner becomes stylesheet order — which would break the guarantee that a
 * consumer's `className` always overrides the library's defaults.
 *
 * Consumers who add their own token families should build their own with
 * `createCn` from `react-a2z/utils` rather than re-exporting this one.
 */
export const cn = createCn() as (...inputs: ClassValue[]) => string;
