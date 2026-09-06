'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
  type RefCallback,
} from 'react';

export type ElementSize = {
  width: number;
  height: number;
};

export type ElementSizeBox = 'border-box' | 'content-box';

export type UseElementSizeOptions = {
  /**
   * Coalesce ResizeObserver updates. `'raf'` (default) = one commit per frame.
   * A number is a leading+trailing throttle in ms.
   */
  throttle?: number | 'raf';
  /**
   * Which box to measure. Default `border-box` (padding + border).
   * `content-box` is the inner content area only.
   */
  box?: ElementSizeBox;
};

export type UseElementSizeResult<T extends Element = HTMLElement> = {
  ref: RefCallback<T>;
  width: number;
  height: number;
};

const EMPTY_SIZE: ElementSize = { width: 0, height: 0 };

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function sizesEqual(a: ElementSize, b: ElementSize) {
  return a.width === b.width && a.height === b.height;
}

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as { current: T | null }).current = value;
}

function firstBoxSize(
  list: ReadonlyArray<ResizeObserverSize> | ResizeObserverSize | undefined,
): ResizeObserverSize | undefined {
  if (!list) return undefined;
  if ('inlineSize' in list) return list;
  return list[0];
}

function sizeFromObserverEntry(
  entry: ResizeObserverEntry,
  box: ElementSizeBox,
): ElementSize | null {
  const sized = firstBoxSize(
    box === 'border-box' ? entry.borderBoxSize : entry.contentBoxSize,
  );
  if (sized && Number.isFinite(sized.inlineSize) && Number.isFinite(sized.blockSize)) {
    return {
      width: Math.round(sized.inlineSize),
      height: Math.round(sized.blockSize),
    };
  }
  if (box === 'content-box') {
    return {
      width: Math.round(entry.contentRect.width),
      height: Math.round(entry.contentRect.height),
    };
  }
  return null;
}

function readElementSize(element: Element, box: ElementSizeBox): ElementSize {
  if (element instanceof HTMLElement) {
    if (box === 'border-box') {
      return { width: element.offsetWidth, height: element.offsetHeight };
    }
    const style = getComputedStyle(element);
    const paddingX =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const paddingY =
      (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    return {
      width: Math.round(element.clientWidth - paddingX),
      height: Math.round(element.clientHeight - paddingY),
    };
  }

  const rect = element.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}

/**
 * Live size of a rendered element via `ResizeObserver`.
 * Hydration-safe (`0 × 0` until the ref is attached).
 *
 * @example
 * const { ref, width, height } = useElementSize<HTMLDivElement>()
 * return <div ref={ref}>{width} × {height}</div>
 *
 * @example
 * const { ref, width } = useElementSize({ throttle: 100, box: 'content-box' }, existingRef)
 */
export function useElementSize<T extends Element = HTMLElement>(
  options?: UseElementSizeOptions,
  forwardedRef?: Ref<T | null>,
): UseElementSizeResult<T> {
  const box = options?.box ?? 'border-box';
  const throttle = options?.throttle ?? 'raf';

  const forwardedRefBox = useRef(forwardedRef);
  forwardedRefBox.current = forwardedRef;

  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>(EMPTY_SIZE);

  const setRef = useCallback<RefCallback<T>>((next) => {
    setNode((prev) => (prev === next ? prev : next));
    assignRef(forwardedRefBox.current, next);
  }, []);

  const applySize = useCallback((next: ElementSize) => {
    setSize((prev) => {
      if (sizesEqual(prev, next)) return prev;
      return next.width === 0 && next.height === 0 ? EMPTY_SIZE : next;
    });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!node) {
      applySize(EMPTY_SIZE);
      return;
    }

    applySize(readElementSize(node, box));

    if (typeof ResizeObserver === 'undefined') return;

    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastEmit = 0;
    let pending: ElementSize | null = null;

    const commit = () => {
      if (!pending) return;
      const next = pending;
      pending = null;
      applySize(next);
    };

    const schedule = (next: ElementSize) => {
      pending = next;
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

    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      schedule(sizeFromObserverEntry(entry, box) ?? readElementSize(node, box));
    });

    try {
      observer.observe(node, { box });
    } catch {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [applySize, box, node, throttle]);

  return { ref: setRef, width: size.width, height: size.height };
}
