'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_HOOK_DELAY,
  useDebouncedCallback,
  type DebounceOptions,
} from './useDebouncedCallback';

export type UseDebounceOptions<T> = DebounceOptions & {
  /** Skip rescheduling when this returns true. Default `Object.is`. */
  equalityFn?: (previous: T, next: T) => boolean;
};

/**
 * Debounce a changing value. The first render returns `value` immediately
 * (SSR-safe). Later changes wait for `delay` ms of quiet time.
 *
 * @example
 * const query = useDebounce(search, 300)
 */
export function useDebounce<T>(
  value: T,
  delay: number = DEFAULT_HOOK_DELAY,
  options?: UseDebounceOptions<T>,
): T {
  const { equalityFn, ...debounceOptions } = options ?? {};
  const [debounced, setDebounced] = useState(value);

  const equalityRef = useRef(equalityFn ?? Object.is);
  equalityRef.current = equalityFn ?? Object.is;

  const update = useDebouncedCallback(
    (next: T) => {
      setDebounced((prev) => (equalityRef.current(prev, next) ? prev : next));
    },
    delay,
    debounceOptions,
  );

  const prevRef = useRef(value);

  useEffect(() => {
    if (equalityRef.current(prevRef.current, value)) return;
    prevRef.current = value;
    update(value);
  }, [update, value]);

  return debounced;
}
