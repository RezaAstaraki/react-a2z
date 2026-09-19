'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from '../../hooks';
import { cn } from '../../utils';

export type CounterVariant = 'number' | 'digits';
export type CounterPlace = number | '.';

/** Options for starting the counter when visible (`useInView` + optional delay). */
export type CounterInView = {
  /** CSS margin around the root (`rootMargin`). e.g. `"0px 0px -20% 0px"`. */
  margin?: string;
  /** Visibility ratio(s) required to trigger. Default `0.2`. */
  threshold?: number | number[];
  /** Only animate the first time it enters view. Default `true`. */
  once?: boolean;
  /** Extra delay in ms after entering view before starting. Default `0`. */
  delay?: number;
  /** Explicit root for the observer. Default viewport. */
  root?: Element | Document | null;
};

export type CounterProps = {
  /** Target value (count-up end / digit display value). */
  value?: number;
  /** Alias of {@link value} for react-countup familiarity. */
  end?: number;
  /** Starting value for number animations. Default `0`. */
  start?: number;
  /** Animation duration in seconds. Default `2`. */
  duration?: number;
  /** Delay before starting, in seconds. */
  delay?: number;
  /** `number` = count-up text; `digits` = odometer columns. Default `number`. */
  variant?: CounterVariant;
  decimals?: number;
  decimal?: string;
  separator?: string;
  prefix?: string;
  suffix?: string;
  useGrouping?: boolean;
  useEasing?: boolean;
  formattingFn?: (value: number) => string;
  /**
   * Start animation when scrolled into view.
   * Pass `true`/`false`, or options like `{ margin, threshold, once, delay }`.
   * Default `true`. Overrides {@link enableScrollSpy} when set.
   */
  inView?: boolean | CounterInView;
  /** @deprecated Prefer {@link inView}. Start when scrolled into view. Default `true`. */
  enableScrollSpy?: boolean;
  /** @deprecated Prefer `inView.delay`. Delay in ms after entering view. */
  scrollSpyDelay?: number;
  /** @deprecated Prefer `inView.once`. Only animate once. Default `true`. */
  scrollSpyOnce?: boolean;
  startOnMount?: boolean;
  preserveValue?: boolean;
  className?: string;
  /** Digit-roll font size in px (`digits` variant). Default `64`. */
  fontSize?: number;
  padding?: number;
  gap?: number;
  borderRadius?: number;
  horizontalPadding?: number;
  places?: CounterPlace[];
  gradientHeight?: number;
  gradientFrom?: string;
  gradientTo?: string;
  digitClassName?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

function resolveInView(
  inView: boolean | CounterInView | undefined,
  enableScrollSpy: boolean,
  scrollSpyDelay: number,
  scrollSpyOnce: boolean,
): false | Required<Pick<CounterInView, 'threshold' | 'once' | 'delay'>> &
  Pick<CounterInView, 'margin' | 'root'> {
  const enabled = inView === undefined ? enableScrollSpy : Boolean(inView);
  if (!enabled) return false;

  const options = typeof inView === 'object' && inView !== null ? inView : {};
  return {
    margin: options.margin,
    threshold: options.threshold ?? 0.2,
    once: options.once ?? scrollSpyOnce,
    delay: options.delay ?? scrollSpyDelay,
    root: options.root,
  };
}

export type CounterHandle = {
  start: () => void;
  reset: () => void;
  update: (next: number) => void;
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function formatNumber(
  value: number,
  {
    decimals,
    decimal,
    separator,
    useGrouping,
    formattingFn,
  }: {
    decimals: number;
    decimal: string;
    separator: string;
    useGrouping: boolean;
    formattingFn?: (value: number) => string;
  },
) {
  if (formattingFn) return formattingFn(value);
  const fixed = value.toFixed(decimals);
  const [intPart = '0', fracPart] = fixed.split('.');
  const grouped = useGrouping
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : intPart;
  return fracPart !== undefined ? `${grouped}${decimal}${fracPart}` : grouped;
}

function detectPlaces(value: number, decimals: number): CounterPlace[] {
  const abs = Math.abs(value);
  const intDigits = Math.max(1, Math.floor(abs).toString().length);
  const places: CounterPlace[] = [];
  for (let i = intDigits - 1; i >= 0; i -= 1) {
    places.push(10 ** i);
  }
  if (decimals > 0) {
    places.push('.');
    for (let i = 1; i <= decimals; i += 1) {
      places.push(10 ** -i);
    }
  }
  return places;
}

function digitForPlace(value: number, place: number) {
  return Math.floor(Math.abs(value) / place + Number.EPSILON) % 10;
}

function DigitColumn({
  value,
  height,
  className,
}: {
  value: number;
  height: number;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height, width: '1ch' }}>
      <div
        className="flex flex-col transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translateY(${-value * height}px)` }}
      >
        {Array.from({ length: 10 }, (_, digit) => (
          <span
            key={digit}
            className="flex items-center justify-center"
            style={{ height, lineHeight: 1 }}
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}

function DigitsCounter({
  value,
  fontSize,
  padding,
  gap,
  borderRadius,
  horizontalPadding,
  places,
  gradientHeight,
  gradientFrom,
  gradientTo,
  className,
  digitClassName,
}: {
  value: number;
  fontSize: number;
  padding: number;
  gap: number;
  borderRadius: number;
  horizontalPadding: number;
  places: CounterPlace[];
  gradientHeight: number;
  gradientFrom: string;
  gradientTo: string;
  className?: string;
  digitClassName?: string;
}) {
  const height = fontSize + padding;

  return (
    <span
      className={cn('a2z-counter-digits relative inline-flex overflow-hidden', className)}
      style={{
        fontSize,
        gap,
        borderRadius,
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 700,
      }}
      aria-label={String(value)}
    >
      {places.map((place, index) =>
        place === '.' ? (
          <span key={`dot-${index}`} className="flex items-center justify-center" style={{ height }}>
            .
          </span>
        ) : (
          <DigitColumn
            key={`${place}-${index}`}
            value={digitForPlace(value, place)}
            height={height}
            className={digitClassName}
          />
        ),
      )}
      <span className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
        <span
          style={{
            height: gradientHeight,
            background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
          }}
        />
        <span
          style={{
            height: gradientHeight,
            background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
          }}
        />
      </span>
    </span>
  );
}

export const Counter = React.forwardRef<CounterHandle, CounterProps>(function Counter(
  {
    value,
    end,
    start = 0,
    duration = 2,
    delay,
    variant = 'number',
    decimals = 0,
    decimal = '.',
    separator = ',',
    prefix = '',
    suffix = '',
    useGrouping = true,
    useEasing = true,
    formattingFn,
    inView,
    enableScrollSpy = true,
    scrollSpyDelay = 0,
    scrollSpyOnce = true,
    startOnMount = true,
    preserveValue = false,
    className,
    fontSize = 64,
    padding = 0,
    gap = 8,
    borderRadius = 4,
    horizontalPadding = 8,
    places,
    gradientHeight = 16,
    gradientFrom = 'rgb(255 255 255)',
    gradientTo = 'transparent',
    digitClassName,
    onStart,
    onEnd,
  },
  ref,
) {
  const target = end ?? value ?? 0;
  const frameRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const displayRef = useRef(start);
  const [display, setDisplay] = useState(start);
  const [activeTarget, setActiveTarget] = useState(target);

  const inViewOptions = useMemo(
    () => resolveInView(inView, enableScrollSpy, scrollSpyDelay, scrollSpyOnce),
    [inView, enableScrollSpy, scrollSpyDelay, scrollSpyOnce],
  );
  const watchInView = inViewOptions !== false;

  const { ref: rootRef, inView: isVisible } = useInView<HTMLSpanElement>({
    skip: !watchInView,
    margin: inViewOptions ? inViewOptions.margin : undefined,
    threshold: inViewOptions ? inViewOptions.threshold : 0.2,
    once: inViewOptions ? inViewOptions.once : true,
    root: inViewOptions ? inViewOptions.root : undefined,
    fallbackInView: true,
  });

  const setDisplayValue = useCallback((next: number) => {
    displayRef.current = next;
    setDisplay(next);
  }, []);

  const resolvedPlaces = useMemo(
    () => places ?? detectPlaces(Math.max(Math.abs(activeTarget), Math.abs(start)), decimals),
    [places, activeTarget, decimals, start],
  );

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const run = useCallback(
    (to: number, from?: number) => {
      stop();
      setActiveTarget(to);
      const origin = from ?? (preserveValue ? displayRef.current : start);
      const durationMs = Math.max(0, duration) * 1000;
      const delayMs = Math.max(0, delay ?? 0) * 1000;
      onStart?.();

      const begin = () => {
        const startedAt = performance.now();
        if (durationMs === 0) {
          setDisplayValue(to);
          onEnd?.();
          return;
        }

        const tick = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / durationMs);
          const eased = useEasing ? easeOutCubic(progress) : progress;
          setDisplayValue(origin + (to - origin) * eased);
          if (progress < 1) {
            frameRef.current = requestAnimationFrame(tick);
          } else {
            setDisplayValue(to);
            frameRef.current = null;
            onEnd?.();
          }
        };
        frameRef.current = requestAnimationFrame(tick);
      };

      if (delayMs > 0) {
        window.setTimeout(begin, delayMs);
      } else {
        begin();
      }
    },
    [delay, duration, onEnd, onStart, preserveValue, setDisplayValue, start, stop, useEasing],
  );

  const startAnimation = useCallback(() => {
    startedRef.current = true;
    run(target);
  }, [run, target]);
  const startAnimationRef = useRef(startAnimation);
  startAnimationRef.current = startAnimation;

  const reset = useCallback(() => {
    stop();
    startedRef.current = false;
    setDisplayValue(start);
  }, [setDisplayValue, start, stop]);

  const update = useCallback(
    (next: number) => {
      startedRef.current = true;
      run(next);
    },
    [run],
  );

  React.useImperativeHandle(ref, () => ({ start: startAnimation, reset, update }), [
    reset,
    startAnimation,
    update,
  ]);

  useEffect(() => {
    if (!startedRef.current) return;
    run(target);
  }, [run, target]);

  useEffect(() => {
    if (!startOnMount || watchInView) return;
    startAnimationRef.current();
    return stop;
    // intentionally mount / target driven
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchInView, startOnMount, target]);

  useEffect(() => {
    if (!inViewOptions || !isVisible) return;
    if (inViewOptions.once && startedRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (inViewOptions.delay > 0) {
      timeoutId = setTimeout(() => startAnimationRef.current(), inViewOptions.delay);
    } else {
      startAnimationRef.current();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inViewOptions, isVisible]);

  useEffect(() => () => stop(), [stop]);

  if (variant === 'digits') {
    return (
      <span ref={rootRef} className={cn('a2z-counter inline-flex items-baseline', className)}>
        {prefix ? <span className="me-1">{prefix}</span> : null}
        <DigitsCounter
          value={display}
          fontSize={fontSize}
          padding={padding}
          gap={gap}
          borderRadius={borderRadius}
          horizontalPadding={horizontalPadding}
          places={resolvedPlaces}
          gradientHeight={gradientHeight}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
          digitClassName={digitClassName}
        />
        {suffix ? <span className="ms-1">{suffix}</span> : null}
      </span>
    );
  }

  const formatted = formatNumber(display, {
    decimals,
    decimal,
    separator,
    useGrouping,
    formattingFn,
  });

  return (
    <span
      ref={rootRef}
      className={cn('a2z-counter inline-block tabular-nums', className)}
      aria-label={`${prefix}${formatted}${suffix}`}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
});

Counter.displayName = 'Counter';

export default Counter;
