import * as React from 'react';

export type UseControllableStateOptions<T> = {
  /** Controlled value. When not `undefined`, the hook is in controlled mode. */
  value?: T;
  /** Initial value for uncontrolled mode. */
  defaultValue: T;
  /** Called on every requested change, in both modes. */
  onChange?: (value: T) => void;
};

/**
 * Single source of truth for the library's controlled/uncontrolled contract.
 *
 * Prefer this over a hand-rolled `value !== undefined ? value : internal` in each
 * component. It used to exist as two byte-identical *private* copies (in
 * `Slider.tsx` and `Tooltip.tsx`), which meant every fix had to be applied twice —
 * and the third, fourth and fifth components that needed it hand-rolled their own
 * subtly different version instead.
 *
 * Behaviour contract (every stateful component must match it):
 * - `value !== undefined` -> controlled. Internal state is ignored.
 * - `value === undefined` -> uncontrolled. Internal state drives rendering.
 * - `onChange` fires in BOTH modes, so a consumer can watch an uncontrolled
 *   component without taking control of it.
 * - Switching modes mid-life is supported and keeps the last rendered value.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<T>(defaultValue);

  // Latest-value ref so `setValue` can stay referentially stable without
  // re-creating on every value change (which would churn consumer effects).
  const current = isControlled ? (value as T) : internal;
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(currentRef.current) : next;

      if (!isControlled) setInternal(resolved);
      onChangeRef.current?.(resolved);
    },
    [isControlled],
  );

  return [current, setValue];
}
