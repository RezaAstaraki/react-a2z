'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Ref,
  type RefCallback,
} from 'react';

export type UseInViewOptions = {
  /** Explicit root for the observer. Default viewport. */
  root?: Element | Document | null;
  /**
   * CSS margin around the root (`rootMargin`).
   * e.g. `"0px 0px -20% 0px"` to trigger before fully visible.
   */
  margin?: string;
  /** Alias of {@link margin}. */
  rootMargin?: string;
  /** Visibility ratio(s) required to count as in view. Default `0`. */
  threshold?: number | number[];
  /** Freeze as in-view after the first intersection. Default `false`. */
  once?: boolean;
  /** Skip observing (keeps last / initial value). */
  skip?: boolean;
  /** Initial `inView` before the first observer callback. Default `false`. */
  initialInView?: boolean;
  /**
   * Value used when `IntersectionObserver` is unavailable.
   * Default `true` so SSR / older browsers still trigger consumers.
   */
  fallbackInView?: boolean;
  /** Fires whenever the in-view state changes. */
  onChange?: (inView: boolean, entry: IntersectionObserverEntry | undefined) => void;
};

export type UseInViewResult<T extends Element = HTMLElement> = {
  ref: RefCallback<T>;
  inView: boolean;
  entry: IntersectionObserverEntry | undefined;
};

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as { current: T | null }).current = value;
}

/**
 * Track whether an element is intersecting the viewport (or a custom root)
 * via `IntersectionObserver`.
 *
 * @example
 * const { ref, inView } = useInView({ threshold: 0.25, once: true })
 * return <div ref={ref}>{inView ? 'visible' : 'hidden'}</div>
 *
 * @example
 * const { ref, inView } = useInView(
 *   { margin: '0px 0px -100px 0px', once: true },
 *   existingRef,
 * )
 */
export function useInView<T extends Element = HTMLElement>(
  options: UseInViewOptions = {},
  forwardedRef?: Ref<T | null>,
): UseInViewResult<T> {
  const {
    root = null,
    margin,
    rootMargin,
    threshold = 0,
    once = false,
    skip = false,
    initialInView = false,
    fallbackInView = true,
    onChange,
  } = options;

  const resolvedMargin = margin ?? rootMargin;

  const forwardedRefBox = useRef(forwardedRef);
  forwardedRefBox.current = forwardedRef;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>();
  const inViewRef = useRef(initialInView);
  const frozenRef = useRef(once && initialInView);

  const setRef = useCallback<RefCallback<T>>((next) => {
    setNode((prev) => (prev === next ? prev : next));
    assignRef(forwardedRefBox.current, next);
  }, []);

  const apply = useCallback((next: boolean, nextEntry?: IntersectionObserverEntry) => {
    if (nextEntry) setEntry(nextEntry);
    if (inViewRef.current === next) return;
    inViewRef.current = next;
    setInView(next);
    onChangeRef.current?.(next, nextEntry);
  }, []);

  useEffect(() => {
    if (skip || frozenRef.current) return;

    if (!node) {
      apply(initialInView);
      setEntry(undefined);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      apply(fallbackInView);
      return;
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        if (!observerEntry) return;
        const intersecting = observerEntry.isIntersecting;
        apply(intersecting, observerEntry);
        if (intersecting && once) {
          frozenRef.current = true;
          observer.disconnect();
        }
      },
      {
        root,
        rootMargin: resolvedMargin,
        threshold,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    apply,
    fallbackInView,
    initialInView,
    node,
    once,
    resolvedMargin,
    root,
    skip,
    threshold,
  ]);

  useEffect(() => {
    if (!once) frozenRef.current = false;
  }, [once]);

  return { ref: setRef, inView, entry };
}
