/**
 * Slider.tsx
 * A dependency-free, headless, compound Slider component.
 * Supports controlled/uncontrolled values, ranges, vertical orientation,
 * keyboard/pointer interaction, render props, classNames & styles slots.
 */

import * as React from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SliderClassNames {
  root?: string;
  label?: string;
  track?: string;
  fill?: string;
  thumb?: string;
  output?: string;
}

export interface SliderStyles {
  root?: React.CSSProperties;
  label?: React.CSSProperties;
  track?: React.CSSProperties;
  fill?: React.CSSProperties;
  thumb?: React.CSSProperties;
  output?: React.CSSProperties;
}

export interface ThumbRenderProps {
  ref: React.Ref<HTMLDivElement>;
  className: string;
  style: React.CSSProperties;
  role: 'slider';
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-valuenow': number;
  'aria-orientation': 'horizontal' | 'vertical';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export interface TrackRenderProps {
  ref: React.Ref<HTMLDivElement>;
  className: string;
  style: React.CSSProperties;
  'data-orientation': 'horizontal' | 'vertical';
}

export interface FillRenderProps {
  ref: React.Ref<HTMLDivElement>;
  className: string;
  style: React.CSSProperties;
  'data-orientation': 'horizontal' | 'vertical';
}

export interface OutputRenderProps {
  ref: React.Ref<HTMLDivElement>;
  className: string;
  style: React.CSSProperties;
  value: number | number[];
  /** Convenience: value formatted with `formatValue` + `suffix`. */
  formatted: React.ReactNode;
}

export interface LabelRenderProps {
  ref: React.Ref<HTMLLabelElement>;
  className: string;
  style: React.CSSProperties;
  value: number | number[];
  /** Convenience: value formatted with `formatValue` + `suffix`. */
  formatted: React.ReactNode;
}

export type SliderValueFormatter = (value: number | number[]) => React.ReactNode;

export interface SliderProps {
  value?: number | number[];
  defaultValue?: number | number[];
  onChange?: (value: number | number[]) => void;
  onChangeEnd?: (value: number | number[]) => void;

  min?: number;
  max?: number;
  step?: number;

  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;

  /** Optional label rendered above/beside the track. */
  label?: React.ReactNode;
  /** Optional suffix appended to the formatted value (e.g. "°", "%"). */
  suffix?: React.ReactNode;
  /** Custom value formatter. Receives the raw value, returns a node. */
  formatValue?: SliderValueFormatter;
  /** Whether to render the default output. Defaults to true. */
  showOutput?: boolean;

  /** Accessible name forwarded to each thumb. */
  'aria-label'?: string;
  'aria-labelledby'?: string;

  /** Top-level render props — forwarded to the default compound children. */
  renderThumb?: (props: ThumbRenderProps) => React.ReactNode;
  renderTrack?: (props: TrackRenderProps) => React.ReactNode;
  renderFill?: (props: FillRenderProps) => React.ReactNode;
  renderOutput?: (props: OutputRenderProps) => React.ReactNode;
  renderLabel?: (props: LabelRenderProps) => React.ReactNode;

  className?: string;
  classNames?: SliderClassNames;
  style?: React.CSSProperties;
  styles?: SliderStyles;

  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Hook: useControllableState                                         */
/* ------------------------------------------------------------------ */

function useControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? (controlledValue as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

/* ------------------------------------------------------------------ */
/*  Small utils                                                        */
/* ------------------------------------------------------------------ */

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function snapToStep(raw: number, step: number, min: number): number {
  const safeStep = step > 0 ? step : 1;
  return Math.round((raw - min) / safeStep) * safeStep + min;
}

/** Default value formatter — joins range values with an en dash. */
function defaultFormat(value: number | number[]): React.ReactNode {
  return Array.isArray(value) ? value.join(' – ') : value;
}

/** Combine formatter + suffix into one node. */
function formatWithSuffix(
  value: number | number[],
  formatValue?: SliderValueFormatter,
  suffix?: React.ReactNode,
): React.ReactNode {
  const formatted = formatValue ? formatValue(value) : defaultFormat(value);
  if (suffix === undefined || suffix === null) return formatted;
  return (
    <>
      {formatted}
      {suffix}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface SliderContextValue {
  value: number | number[];

  setValue: (v: number | number[]) => void;
  commitValue: (v: number | number[]) => void;
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  rootRef: React.RefObject<HTMLDivElement>;
  trackRef: React.RefObject<HTMLDivElement>;
  classNames?: SliderClassNames;
  styles?: SliderStyles;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Formatter used by label + output. */
  formatValue?: SliderValueFormatter;
  /** Suffix appended after formatted value. */
  suffix?: React.ReactNode;
}

const SliderContext = React.createContext<SliderContextValue | null>(null);

function useSliderContext(component: string): SliderContextValue {
  const ctx = React.useContext(SliderContext);
  if (!ctx) {
    throw new Error(`<Slider.${component}> must be used inside <Slider>`);
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Root: Slider                                                       */
/* ------------------------------------------------------------------ */

const SliderRoot = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 50,
      onChange,
      onChangeEnd,
      min = 0,
      max = 100,
      step = 1,
      orientation = 'horizontal',
      disabled = false,
      label,
      suffix,
      formatValue,
      showOutput = true,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      renderThumb,
      renderTrack,
      renderFill,
      renderOutput,
      renderLabel,
      className,
      classNames,
      style,
      styles,
      children,
    },
    forwardedRef,
  ) => {
    const [value, setValue] = useControllableState<number | number[]>({
      value: controlledValue,
      defaultValue,
      onChange,
    });

    const rootRef = React.useRef<HTMLDivElement>(null);
    const trackRef = React.useRef<HTMLDivElement>(null);

    const setRootRef = React.useMemo(
      () => mergeRefs<HTMLDivElement>(forwardedRef, rootRef),
      [forwardedRef],
    );

    const commitValue = React.useCallback(
      (next: number | number[]) => {
        onChangeEnd?.(next);
      },
      [onChangeEnd],
    );

    const values = React.useMemo(() => (Array.isArray(value) ? value : [value]), [value]);

    const ctx: SliderContextValue = {
      value,
      setValue,
      commitValue,
      min,
      max,
      step,
      orientation,
      disabled,
      rootRef,
      trackRef,
      classNames,
      styles,
      ariaLabel,
      ariaLabelledBy,
      formatValue,
      suffix,
    };

    const rootClassName = [classNames?.root, className].filter(Boolean).join(' ');

    // Only render label if provided (or if a renderLabel is given).
    const hasLabel = label !== undefined || renderLabel !== undefined;

    const defaultChildren = (
      <>
        {hasLabel && <SliderLabel render={renderLabel}>{label}</SliderLabel>}
        <SliderTrack render={renderTrack}>
          <SliderFill render={renderFill} />
          {values.map((_, i) => (
            <SliderThumb key={i} index={i} render={renderThumb} />
          ))}
        </SliderTrack>
        {showOutput && <SliderOutput render={renderOutput} />}
      </>
    );

    return (
      <SliderContext.Provider value={ctx}>
        <div
          ref={setRootRef}
          className={rootClassName || undefined}
          style={{ ...styles?.root, ...style }}
          data-orientation={orientation}
          data-disabled={disabled || undefined}
        >
          {children ?? defaultChildren}
        </div>
      </SliderContext.Provider>
    );
  },
);
SliderRoot.displayName = 'Slider';

/* ------------------------------------------------------------------ */
/*  Slider.Label                                                       */
/* ------------------------------------------------------------------ */

interface LabelProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  render?: (props: LabelRenderProps) => React.ReactNode;
}

const SliderLabel = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, style, render }, forwardedRef) => {
    const { value, classNames, styles, formatValue, suffix } = useSliderContext('Label');

    const formatted = formatWithSuffix(value, formatValue, suffix);

    const props: LabelRenderProps = {
      ref: forwardedRef,
      className: [classNames?.label, className].filter(Boolean).join(' '),
      style: { ...styles?.label, ...style },
      value,
      formatted,
    };

    if (render) return <>{render(props)}</>;

    return (
      <label ref={forwardedRef} className={props.className || undefined} style={props.style}>
        {children ?? formatted}
      </label>
    );
  },
);
SliderLabel.displayName = 'Slider.Label';

/* ------------------------------------------------------------------ */
/*  Slider.Track                                                       */
/* ------------------------------------------------------------------ */

interface TrackProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  render?: (props: TrackRenderProps) => React.ReactNode;
}

const SliderTrack = React.forwardRef<HTMLDivElement, TrackProps>(
  ({ children, className, style, render }, forwardedRef) => {
    const { trackRef, classNames, styles, orientation } = useSliderContext('Track');

    const setRef = React.useMemo(
      () => mergeRefs<HTMLDivElement>(forwardedRef, trackRef),
      [forwardedRef, trackRef],
    );

    const props: TrackRenderProps = {
      ref: setRef,
      className: [classNames?.track, className].filter(Boolean).join(' '),
      style: { ...styles?.track, ...style },
      'data-orientation': orientation,
    };

    if (render) return <>{render(props)}</>;
    return <div {...props}>{children}</div>;
  },
);
SliderTrack.displayName = 'Slider.Track';

/* ------------------------------------------------------------------ */
/*  Slider.Fill                                                        */
/* ------------------------------------------------------------------ */

interface FillProps {
  className?: string;
  style?: React.CSSProperties;
  render?: (props: FillRenderProps) => React.ReactNode;
}

const SliderFill = React.forwardRef<HTMLDivElement, FillProps>(
  ({ className, style, render }, forwardedRef) => {
    const { value, min, max, orientation, classNames, styles } = useSliderContext('Fill');

    const values = Array.isArray(value) ? value : [value];
    const span = max - min || 1;

    const a = values[0] ?? min;
    const b = values.length > 1 ? (values[1] ?? max) : undefined;

    const startPct = b === undefined ? 0 : ((Math.min(a, b) - min) / span) * 100;
    const endPct =
      b === undefined ? ((a - min) / span) * 100 : ((Math.max(a, b) - min) / span) * 100;
    const sizePct = Math.max(0, endPct - startPct);

    const positionStyle: React.CSSProperties =
      orientation === 'horizontal'
        ? { left: `${startPct}%`, width: `${sizePct}%` }
        : { bottom: `${startPct}%`, height: `${sizePct}%` };

    const props: FillRenderProps = {
      ref: forwardedRef,
      className: [classNames?.fill, className].filter(Boolean).join(' '),
      style: {
        ...styles?.fill,
        ...positionStyle,
        ...style,
      },
      'data-orientation': orientation,
    };

    if (render) return <>{render(props)}</>;
    return <div {...props} />;
  },
);
SliderFill.displayName = 'Slider.Fill';

/* ------------------------------------------------------------------ */
/*  Slider.Thumb                                                       */
/* ------------------------------------------------------------------ */

interface ThumbProps {
  index: number;
  className?: string;
  style?: React.CSSProperties;
  render?: (props: ThumbRenderProps) => React.ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const SliderThumb = React.forwardRef<HTMLDivElement, ThumbProps>(
  (
    {
      index,
      className,
      style,
      render,
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledByProp,
    },
    forwardedRef,
  ) => {
    const {
      value,
      setValue,
      commitValue,
      min,
      max,
      step,
      orientation,
      disabled,
      trackRef,
      classNames,
      styles,
      ariaLabel,
      ariaLabelledBy,
    } = useSliderContext('Thumb');

    const values = React.useMemo(() => (Array.isArray(value) ? value : [value]), [value]);
    const currentValue = values[index] ?? min;
    const isRange = Array.isArray(value) && values.length > 1;

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();

        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        el.focus();

        const compute = (clientX: number, clientY: number): number => {
          const track = trackRef.current;
          if (!track) return currentValue;
          const rect = track.getBoundingClientRect();
          let ratio: number;
          if (orientation === 'horizontal') {
            ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
          } else {
            ratio = rect.height === 0 ? 0 : 1 - (clientY - rect.top) / rect.height;
          }
          ratio = Math.max(0, Math.min(1, ratio));
          const raw = min + ratio * (max - min);
          const snapped = snapToStep(raw, step, min);

          const lower = isRange && index > 0 ? (values[index - 1] ?? min) : min;
          const upper = isRange && index < values.length - 1 ? (values[index + 1] ?? max) : max;

          return clamp(snapped, lower, upper);
        };

        const buildNext = (next: number): number | number[] => {
          if (!Array.isArray(value)) return next;
          const arr = values.slice();
          arr[index] = next;
          return arr;
        };

        const move = (ev: PointerEvent) => {
          setValue(buildNext(compute(ev.clientX, ev.clientY)));
        };

        move(e.nativeEvent);

        const up = (ev: PointerEvent) => {
          el.releasePointerCapture(e.pointerId);
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          commitValue(buildNext(compute(ev.clientX, ev.clientY)));
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      },
      [
        disabled,
        min,
        max,
        step,
        orientation,
        values,
        index,
        value,
        currentValue,
        isRange,
        setValue,
        commitValue,
        trackRef,
      ],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;

        const isHorizontal = orientation === 'horizontal';
        let delta = 0;

        switch (e.key) {
          case 'ArrowRight':
            if (isHorizontal) delta = step;
            break;
          case 'ArrowLeft':
            if (isHorizontal) delta = -step;
            break;
          case 'ArrowUp':
            if (!isHorizontal) delta = step;
            break;
          case 'ArrowDown':
            if (!isHorizontal) delta = -step;
            break;
          case 'PageUp':
            delta = step * 10;
            break;
          case 'PageDown':
            delta = -step * 10;
            break;
          case 'Home':
            delta = min - currentValue;
            break;
          case 'End':
            delta = max - currentValue;
            break;
          default:
            return;
        }

        if (delta === 0) return;
        e.preventDefault();

        const lower = isRange && index > 0 ? (values[index - 1] ?? min) : min;
        const upper = isRange && index < values.length - 1 ? (values[index + 1] ?? max) : max;

        const next = clamp(currentValue + delta, lower, upper);
        let out: number | number[];
        if (Array.isArray(value)) {
          const arr = values.slice();
          arr[index] = next;
          out = arr;
        } else {
          out = next;
        }
        setValue(out);
        commitValue(out);
      },
      [
        disabled,
        orientation,
        step,
        min,
        max,
        currentValue,
        values,
        index,
        value,
        isRange,
        setValue,
        commitValue,
      ],
    );

    const percent = max === min ? 0 : ((currentValue - min) / (max - min)) * 100;

    const props: ThumbRenderProps = {
      ref: forwardedRef,
      className: [classNames?.thumb, className].filter(Boolean).join(' '),
      style: {
        ...styles?.thumb,
        ...(orientation === 'horizontal' ? { left: `${percent}%` } : { bottom: `${percent}%` }),
        ...style,
      },
      role: 'slider',
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': currentValue,
      'aria-orientation': orientation,
      ...(ariaLabelProp || ariaLabel ? { 'aria-label': ariaLabelProp ?? ariaLabel } : {}),
      ...(ariaLabelledByProp || ariaLabelledBy
        ? { 'aria-labelledby': ariaLabelledByProp ?? ariaLabelledBy }
        : {}),
      tabIndex: disabled ? -1 : 0,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
    };

    if (render) return <>{render(props)}</>;
    return <div {...props} />;
  },
);
SliderThumb.displayName = 'Slider.Thumb';

/* ------------------------------------------------------------------ */
/*  Slider.Output                                                      */
/* ------------------------------------------------------------------ */

interface OutputProps {
  className?: string;
  style?: React.CSSProperties;
  render?: (props: OutputRenderProps) => React.ReactNode;
  children?: (value: number | number[]) => React.ReactNode;
}

const SliderOutput = React.forwardRef<HTMLDivElement, OutputProps>(
  ({ className, style, render, children }, forwardedRef) => {
    const { value, classNames, styles, formatValue, suffix } = useSliderContext('Output');

    const formatted = formatWithSuffix(value, formatValue, suffix);

    const props: OutputRenderProps = {
      ref: forwardedRef,
      className: [classNames?.output, className].filter(Boolean).join(' '),
      style: { ...styles?.output, ...style },
      value,
      formatted,
    };

    if (render) return <>{render(props)}</>;

    const content = children ? children(value) : formatted;

    return <div {...props}>{content}</div>;
  },
);
SliderOutput.displayName = 'Slider.Output';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

type SliderComponent = React.ForwardRefExoticComponent<
  SliderProps & React.RefAttributes<HTMLDivElement>
> & {
  Label: typeof SliderLabel;
  Track: typeof SliderTrack;
  Fill: typeof SliderFill;
  Thumb: typeof SliderThumb;
  Output: typeof SliderOutput;
};

const Slider = SliderRoot as SliderComponent;
Slider.Label = SliderLabel;
Slider.Track = SliderTrack;
Slider.Fill = SliderFill;
Slider.Thumb = SliderThumb;
Slider.Output = SliderOutput;

export { Slider };
export default Slider;
