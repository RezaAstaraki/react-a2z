import type * as React from 'react';

/**
 * Merges a forwarded ref with one or more internal refs.
 *
 * Prefer this over `forwardedRef ?? internalRef`: the `??` form silently drops
 * the internal ref whenever the consumer passes one, which breaks internal
 * measurements (Slider drag math) in exactly the case a consumer is most likely
 * to hit.
 *
 * Previously duplicated privately in `Slider.tsx` and `Tooltip.tsx`.
 */
export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined | null>
): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === 'function') {
        ref(node);
      } else {
        // MutableRefObject is readonly-safe here because we own the assignment.
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}
