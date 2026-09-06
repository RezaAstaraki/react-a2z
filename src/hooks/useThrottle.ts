'use client';

import { useDebounce, type UseDebounceOptions } from './useDebounce';
import {
  DEFAULT_HOOK_DELAY,
  normalizeDelay,
  useDebouncedCallback,
  type DebounceOptions,
  type DebouncedCallback,
} from './useDebouncedCallback';

export type UseThrottleOptions<T> = Omit<UseDebounceOptions<T>, 'maxWait'>;
export type ThrottleOptions = Omit<DebounceOptions, 'maxWait'>;

/**
 * Throttle a changing value. Updates at most once per `delay` ms.
 * Defaults to leading + trailing (lodash throttle).
 *
 * @example
 * const offset = useThrottle(scrollY, 100)
 */
export function useThrottle<T>(
  value: T,
  delay: number = DEFAULT_HOOK_DELAY,
  options?: UseThrottleOptions<T>,
): T {
  return useDebounce(value, delay, {
    leading: options?.leading ?? true,
    trailing: options?.trailing ?? true,
    equalityFn: options?.equalityFn,
    maxWait: normalizeDelay(delay),
  });
}

/**
 * Stable throttled callback. Same controls as {@link useDebouncedCallback}
 * (`cancel`, `flush`, `isPending`).
 *
 * @example
 * const onScroll = useThrottledCallback(handleScroll, 100)
 */
export function useThrottledCallback<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number = DEFAULT_HOOK_DELAY,
  options?: ThrottleOptions,
): DebouncedCallback<T> {
  return useDebouncedCallback(fn, delay, {
    leading: options?.leading ?? true,
    trailing: options?.trailing ?? true,
    maxWait: normalizeDelay(delay),
  });
}
