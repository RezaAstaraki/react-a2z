'use client';

import { useSyncExternalStore } from 'react';

export type WindowSize = {
  width: number;
  height: number;
};

export type UseWindowSizeOptions = {
  /**
   * Coalesce resize updates. `'raf'` (default) = one commit per frame.
   * A number is a leading+trailing throttle in ms.
   */
  throttle?: number | 'raf';
  /**
   * Prefer `visualViewport` size when available (mobile keyboard, URL bar,
   * pinch-zoom). Falls back to `innerWidth` / `innerHeight`.
   */
  visualViewport?: boolean;
};

const SERVER_SIZE: WindowSize = { width: 0, height: 0 };

type Store = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => WindowSize;
};

const stores = new Map<string, Store>();

function readSize(useVisualViewport: boolean): WindowSize {
  if (typeof window === 'undefined') return SERVER_SIZE;

  const viewport = useVisualViewport ? window.visualViewport : null;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function sizesEqual(a: WindowSize, b: WindowSize) {
  return a.width === b.width && a.height === b.height;
}

function getStore(useVisualViewport: boolean, throttle: number | 'raf'): Store {
  const key = `${useVisualViewport}:${throttle}`;
  const existing = stores.get(key);
  if (existing) return existing;

  let snapshot: WindowSize = SERVER_SIZE;
  const listeners = new Set<() => void>();
  let attached = false;
  let rafId = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let orientationTimers: ReturnType<typeof setTimeout>[] = [];
  let lastEmit = 0;

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const commit = () => {
    const next = readSize(useVisualViewport);
    if (sizesEqual(snapshot, next) && snapshot !== SERVER_SIZE) return;
    snapshot = next;
    emit();
  };

  const schedule = () => {
    if (throttle === 'raf' || throttle === 0) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        commit();
      });
      return;
    }

    const wait = throttle;
    const now = Date.now();
    const remaining = wait - (now - lastEmit);

    if (remaining <= 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      lastEmit = now;
      commit();
      return;
    }

    if (timeoutId !== undefined) return;
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      lastEmit = Date.now();
      commit();
    }, remaining);
  };

  const onResize = () => schedule();

  const onOrientationChange = () => {
    schedule();
    // iOS often reports the pre-rotation size until the animation ends.
    orientationTimers.push(setTimeout(schedule, 250), setTimeout(schedule, 500));
  };

  const attach = () => {
    if (attached || typeof window === 'undefined') return;
    attached = true;
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onOrientationChange);
    if (useVisualViewport && window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }
    commit();
  };

  const detach = () => {
    if (!attached || typeof window === 'undefined') return;
    attached = false;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onOrientationChange);
    window.visualViewport?.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('scroll', onResize);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = undefined;
    orientationTimers.forEach(clearTimeout);
    orientationTimers = [];
  };

  const store: Store = {
    subscribe(onChange) {
      listeners.add(onChange);
      attach();
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) {
          detach();
          stores.delete(key);
        }
      };
    },
    getSnapshot() {
      // Client renders can read getSnapshot before subscribe/attach runs.
      // Never keep returning the SSR placeholder once `window` exists.
      if (typeof window !== 'undefined' && snapshot === SERVER_SIZE) {
        snapshot = readSize(useVisualViewport);
      }
      return snapshot;
    },
  };

  stores.set(key, store);
  return store;
}

function getServerSnapshot(): WindowSize {
  return SERVER_SIZE;
}

/**
 * Live viewport size. Hydration-safe (`0 × 0` until the first client
 * measurement). All callers with the same options share one listener.
 *
 * @example
 * const { width, height } = useWindowSize()
 * const { width } = useWindowSize({ throttle: 100, visualViewport: true })
 */
export function useWindowSize(options?: UseWindowSizeOptions): WindowSize {
  const useVisualViewport = options?.visualViewport ?? false;
  const throttle = options?.throttle ?? 'raf';
  const store = getStore(useVisualViewport, throttle);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}
