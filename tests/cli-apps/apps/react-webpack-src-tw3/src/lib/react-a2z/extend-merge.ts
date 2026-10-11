import { extendTailwindMerge, twMerge } from 'tailwind-merge';

/**
 * Merge configuration for `cn`.
 *
 * IMPORTANT — this is deliberately almost empty, and that is the correct design.
 *
 * `tailwind-merge`'s default validator is permissive enough to merge the `a2z`
 * COLOR tokens with no configuration at all: the `bg-color` group is effectively
 * "bg-<x>[-<y>]", which already covers `bg-primary-600`, `bg-primary-soft`,
 * `bg-surface` and `bg-surface-sunken`. Verified by test in
 * `scripts/verify-tokens.mjs`.
 *
 * Declaring those colours as custom `classGroups` made things WORSE: a custom
 * group with the same id replaces the default one, and listing two-segment names
 * alongside the wildcard corrupted matching, so `cn('bg-primary-600',
 * 'bg-primary-soft')` stopped merging. Do not re-add them.
 *
 * What genuinely needs registering is a custom SCALE — a new step vocabulary
 * tailwind-merge cannot infer from the default theme, e.g. `shadow-surface-md`,
 * `rounded-a2z-lg`, `text-heading-lg`. `createCn` is the hook for that, and for
 * downstream design systems with their own token vocabulary.
 */
export const a2zClassGroups: Record<string, unknown> = {};

/**
 * Builds a merge-aware `cn` with extra class groups.
 *
 * Use this when you add your own Tailwind scales (in `@theme` / `theme.extend`)
 * that tailwind-merge cannot infer, so that YOUR classes merge last-one-wins
 * alongside the library's:
 *
 * ```ts
 * import { createCn } from 'react-a2z/utils';
 *
 * export const cn = createCn({
 *   'shadow-brand': ['shadow-brand-sm', 'shadow-brand-md'],
 * });
 * ```
 */
export function createCn(...extraClassGroups: Array<Record<string, unknown>>) {
  const merged = Object.assign({}, ...extraClassGroups) as Record<string, unknown>;

  if (Object.keys(merged).length === 0) {
    // Nothing to register — skip extendTailwindMerge entirely so the common path
    // hands back the plain (and slightly faster) default merger.
    return twMerge;
  }

  return extendTailwindMerge({
    extend: { classGroups: Object.assign({}, a2zClassGroups, merged) as never },
  });
}
