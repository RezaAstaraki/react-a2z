'use client';

import { useEffect, useMemo, useRef } from 'react';

export const DEFAULT_HOOK_DELAY = 300;

export type DebounceOptions = {
  /** Invoke on the leading edge of the wait window. Default `false`. */
  leading?: boolean;
  /** Invoke on the trailing edge of the wait window. Default `true`. */
  trailing?: boolean;
  /** Force an invoke after this many ms even if calls keep arriving. */
  maxWait?: number;
};

export type DebouncedControls = {
  /** Clear pending timers without invoking. */
  cancel: () => void;
  /** Immediately invoke with the latest args, if any are pending. */
  flush: () => void;
  /** Whether a timer is currently scheduled. */
  isPending: () => boolean;
};

export type DebouncedCallback<T extends (...args: never[]) => unknown> = ((
  ...args: Parameters<T>
) => void) &
  DebouncedControls;

export function normalizeDelay(delay: number | undefined): number {
  if (delay == null || !Number.isFinite(delay) || delay < 0) return 0;
  return delay;
}

function normalizeMaxWait(maxWait: number | undefined): number | undefined {
  if (maxWait == null || !Number.isFinite(maxWait) || maxWait < 0) return undefined;
  return maxWait;
}

/**
 * Stable debounced callback (lodash-compatible leading / trailing / maxWait).
 * The returned function identity never changes; `fn`, `delay`, and options
 * are read from refs so callers can pass inline functions safely.
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number = DEFAULT_HOOK_DELAY,
  options?: DebounceOptions,
): DebouncedCallback<T> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const delayRef = useRef(normalizeDelay(delay));
  delayRef.current = normalizeDelay(delay);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const timerIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastArgsRef = useRef<Parameters<T> | undefined>(undefined);
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef(0);

  const api = useMemo(() => {
    const clearTimer = () => {
      if (timerIdRef.current !== undefined) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = undefined;
      }
    };

    const getLeading = () => optionsRef.current?.leading ?? false;
    const getTrailing = () => optionsRef.current?.trailing ?? true;
    const getMaxWait = () => normalizeMaxWait(optionsRef.current?.maxWait);

    const invoke = (time: number) => {
      const args = lastArgsRef.current;
      lastArgsRef.current = undefined;
      lastInvokeTimeRef.current = time;
      if (args) fnRef.current(...args);
    };

    const remainingWait = (time: number) => {
      const lastCallTime = lastCallTimeRef.current ?? time;
      const timeWaiting = delayRef.current - (time - lastCallTime);
      const maxing = getMaxWait();
      if (maxing == null) return timeWaiting;
      return Math.min(timeWaiting, maxing - (time - lastInvokeTimeRef.current));
    };

    const shouldInvoke = (time: number) => {
      const lastCallTime = lastCallTimeRef.current;
      if (lastCallTime === undefined) return true;

      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
      const wait = delayRef.current;
      const maxing = getMaxWait();

      return (
        timeSinceLastCall >= wait ||
        timeSinceLastCall < 0 ||
        (maxing != null && timeSinceLastInvoke >= maxing)
      );
    };

    const trailingEdge = (time: number) => {
      timerIdRef.current = undefined;
      if (getTrailing() && lastArgsRef.current) {
        invoke(time);
        return;
      }
      lastArgsRef.current = undefined;
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        trailingEdge(time);
        return;
      }
      timerIdRef.current = setTimeout(timerExpired, remainingWait(time));
    };

    const leadingEdge = (time: number) => {
      lastInvokeTimeRef.current = time;
      timerIdRef.current = setTimeout(timerExpired, delayRef.current);
      if (getLeading()) invoke(time);
    };

    const cancel = () => {
      clearTimer();
      lastInvokeTimeRef.current = 0;
      lastArgsRef.current = undefined;
      lastCallTimeRef.current = undefined;
    };

    const flush = () => {
      if (timerIdRef.current === undefined) return;
      trailingEdge(Date.now());
    };

    const isPending = () => timerIdRef.current !== undefined;

    const debounced = ((...args: Parameters<T>) => {
      // Zero wait is synchronous — no timer, no extra paint.
      if (delayRef.current === 0) {
        lastArgsRef.current = args;
        lastCallTimeRef.current = Date.now();
        clearTimer();
        invoke(Date.now());
        return;
      }

      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgsRef.current = args;
      lastCallTimeRef.current = time;

      if (isInvoking) {
        if (timerIdRef.current === undefined) {
          leadingEdge(time);
          return;
        }
        if (getMaxWait() != null) {
          clearTimer();
          timerIdRef.current = setTimeout(timerExpired, delayRef.current);
          invoke(time);
        }
        return;
      }

      if (timerIdRef.current === undefined) {
        timerIdRef.current = setTimeout(timerExpired, delayRef.current);
      }
    }) as DebouncedCallback<T>;

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.isPending = isPending;

    return debounced;
  }, []);

  useEffect(() => () => api.cancel(), [api]);

  return api;
}
