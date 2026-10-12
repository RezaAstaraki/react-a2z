"use client";

import * as React from "react";
import {
  cn,
  copyToClipboard,
  hexToRgb,
  normalizeHex,
  rgbToHex,
} from "../../utils";
import { useControllableState } from "../../hooks";
import ColorPicker from "../ColorPicker/ColorPicker";
import Slider from "../Slider/Slider";

export type GradientType = "linear" | "radial";

export interface GradientStop {
  /** Stable identifier used for selection and rendering. */
  id: string;
  /** Stop color as a hex string. */
  color: string;
  /** Stop position from 0 to 100. */
  position: number;
}

export interface GradientValue {
  /** CSS gradient kind. */
  type: GradientType;
  /** Linear-gradient angle in degrees. Retained for radial gradients. */
  angle: number;
  /** Ordered or unordered stops; CSS output is sorted by position. */
  stops: GradientStop[];
}

export interface GradientPreset {
  /** Human-readable preset name. */
  name: string;
  /** Legacy shorthand; colors are distributed evenly. */
  colors?: string[];
  /** Positioned preset stops. Takes precedence over colors. */
  stops?: Array<Omit<GradientStop, "id"> & { id?: string }>;
  /** Gradient kind. Defaults to linear. */
  type?: GradientType;
  /** Linear angle. Defaults to 90. */
  angle?: number;
}

export interface GradientMakerClassNames {
  root?: string;
  label?: string;
  preview?: string;
  presets?: string;
  preset?: string;
  type?: string;
  stops?: string;
  stop?: string;
  stopControls?: string;
  /** @deprecated Use stopControls. */
  customColors?: string;
  /** @deprecated Use stop. */
  swatch?: string;
  colorPicker?: string;
  position?: string;
  angle?: string;
  addButton?: string;
  removeButton?: string;
  copyRow?: string;
  copyInput?: string;
  copyButton?: string;
}

export interface GradientMakerStyles {
  root?: React.CSSProperties;
  label?: React.CSSProperties;
  preview?: React.CSSProperties;
  presets?: React.CSSProperties;
  preset?: React.CSSProperties;
  type?: React.CSSProperties;
  stops?: React.CSSProperties;
  stop?: React.CSSProperties;
  stopControls?: React.CSSProperties;
  /** @deprecated Use stopControls. */
  customColors?: React.CSSProperties;
  /** @deprecated Use stop. */
  swatch?: React.CSSProperties;
  colorPicker?: React.CSSProperties;
  position?: React.CSSProperties;
  angle?: React.CSSProperties;
  addButton?: React.CSSProperties;
  removeButton?: React.CSSProperties;
  copyRow?: React.CSSProperties;
  copyInput?: React.CSSProperties;
  copyButton?: React.CSSProperties;
}

export interface GradientMakerProps {
  /** Heading text above the preview. Default "Gradient". */
  label?: string;
  /** Controlled structured gradient value. */
  value?: GradientValue;
  /** Initial value in uncontrolled mode. */
  defaultValue?: GradientValue;
  /** Called with the structured value after every edit. */
  onChange?: (value: GradientValue) => void;
  /** Compatibility callback receiving generated CSS after every edit. */
  onGradientChange?: (gradient: string) => void;
  /** Replaces the built-in presets. An empty array hides them. */
  presets?: GradientPreset[];
  /** Whether to render the CSS output row. Defaults to true. */
  showCopy?: boolean;
  /** Disables every editing control while keeping the preview visible. */
  disabled?: boolean;
  /** Merged onto the root before classNames.root. */
  className?: string;
  /** Inline style on the root; styles.root wins on conflict. */
  style?: React.CSSProperties;
  /** Per-slot class overrides. */
  classNames?: GradientMakerClassNames;
  /** Per-slot inline styles. */
  styles?: GradientMakerStyles;
}

const DEFAULT_ANGLE = 90;
const DEFAULT_VALUE: GradientValue = {
  type: "linear",
  angle: DEFAULT_ANGLE,
  stops: [
    { id: "start", color: "#667eea", position: 0 },
    { id: "end", color: "#764ba2", position: 100 },
  ],
};

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "Purple sunset", colors: ["#a8edea", "#fed6e3"] },
  { name: "Ocean blue", colors: ["#2980b9", "#6dd5fa", "#ffffff"] },
  { name: "Sunset orange", colors: ["#fa709a", "#fee140"] },
  { name: "Matrix green", colors: ["#11998e", "#38ef7d"] },
  { name: "Dark purple", colors: ["#30cfd0", "#330867"] },
  { name: "Pink dream", colors: ["#a18cd1", "#fbc2eb"] },
  { name: "Teal blue", colors: ["#84fab0", "#8fd3f4"] },
  { name: "Golden hour", colors: ["#f093fb", "#f5576c"] },
  { name: "Midnight", colors: ["#232526", "#414345"] },
  {
    name: "Rainbow",
    colors: [
      "#ff0000",
      "#ff7f00",
      "#ffff00",
      "#00ff00",
      "#0000ff",
      "#4b0082",
      "#9400d3",
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeColor(color: string): string {
  return normalizeHex(color) ?? "#000000";
}

function evenPosition(index: number, length: number): number {
  return length <= 1 ? 0 : Math.round((index / (length - 1)) * 100);
}

function normalizeValue(value: GradientValue): GradientValue {
  let stops = value.stops.length > 0 ? value.stops : DEFAULT_VALUE.stops;
  if (stops.length === 1) {
    const stop = stops[0]!;
    stops = [
      { ...stop, position: 0 },
      { ...stop, id: stop.id + "-end", position: 100 },
    ];
  }
  return {
    type: value.type === "radial" ? "radial" : "linear",
    angle: clamp(
      Number.isFinite(value.angle) ? value.angle : DEFAULT_ANGLE,
      0,
      360,
    ),
    stops: stops.map((stop, index) => ({
      id: stop.id || "stop-" + index,
      color: safeColor(stop.color),
      position: clamp(
        Number.isFinite(stop.position)
          ? stop.position
          : evenPosition(index, stops.length),
        0,
        100,
      ),
    })),
  };
}

function presetValue(preset: GradientPreset): GradientValue {
  const sourceStops = preset.stops?.length
    ? preset.stops.map((stop, index) => ({
        id: stop.id || "preset-" + preset.name + "-" + index,
        color: stop.color,
        position: stop.position,
      }))
    : (preset.colors ?? []).map((color, index, colors) => ({
        id: "preset-" + preset.name + "-" + index,
        color,
        position: evenPosition(index, colors.length),
      }));

  return normalizeValue({
    type: preset.type ?? "linear",
    angle: preset.angle ?? DEFAULT_ANGLE,
    stops: sourceStops,
  });
}

/** Converts a structured gradient value into a valid CSS gradient string. */
export function gradientToCss(input: GradientValue): string {
  const value = normalizeValue(input);
  const stops = [...value.stops].sort((a, b) => a.position - b.position);
  const cssStops = stops
    .map(
      (stop) => safeColor(stop.color) + " " + Math.round(stop.position) + "%",
    )
    .join(", ");
  if (value.type === "radial")
    return "radial-gradient(circle, " + cssStops + ")";
  return (
    "linear-gradient(" + Math.round(value.angle) + "deg, " + cssStops + ")"
  );
}

function sameGradient(a: GradientValue, b: GradientValue): boolean {
  return gradientToCss(a) === gradientToCss(b);
}

function sliderNumber(value: number | number[], fallback: number): number {
  return Array.isArray(value) ? (value[0] ?? fallback) : value;
}

function interpolateColor(a: string, b: string, ratio: number): string {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  if (!first || !second) return "#808080";
  return rgbToHex({
    r: first.r + (second.r - first.r) * ratio,
    g: first.g + (second.g - first.g) * ratio,
    b: first.b + (second.b - first.b) * ratio,
  });
}

function nextStop(stops: GradientStop[], id: string): GradientStop {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return { id, color: "#808080", position: 50 };
  if (sorted.length === 1) {
    return { id, color: sorted[0]?.color ?? "#808080", position: 100 };
  }

  let left = sorted[0]!;
  let right = sorted[1]!;
  let largestGap = right.position - left.position;
  for (let index = 1; index < sorted.length - 1; index += 1) {
    const current = sorted[index]!;
    const candidate = sorted[index + 1]!;
    const gap = candidate.position - current.position;
    if (gap > largestGap) {
      left = current;
      right = candidate;
      largestGap = gap;
    }
  }
  return {
    id,
    color: interpolateColor(left.color, right.color, 0.5),
    position: Math.round((left.position + right.position) / 2),
  };
}

const GradientMaker = React.forwardRef<HTMLDivElement, GradientMakerProps>(
  (
    {
      label = "Gradient",
      value: controlledValue,
      defaultValue = DEFAULT_VALUE,
      onChange,
      onGradientChange,
      presets = GRADIENT_PRESETS,
      showCopy = true,
      disabled = false,
      className,
      style,
      classNames,
      styles,
    },
    forwardedRef,
  ) => {
    const emitChange = React.useCallback(
      (next: GradientValue) => {
        const normalized = normalizeValue(next);
        onChange?.(normalized);
        onGradientChange?.(gradientToCss(normalized));
      },
      [onChange, onGradientChange],
    );

    const [rawGradient, setGradient] = useControllableState<GradientValue>({
      value: controlledValue,
      defaultValue: normalizeValue(defaultValue),
      onChange: emitChange,
    });
    const gradient = normalizeValue(rawGradient);
    const css = gradientToCss(gradient);
    const labelId = React.useId();
    const idPrefix = React.useId().replace(/:/g, "");
    const nextId = React.useRef(0);
    const [selectedId, setSelectedId] = React.useState(
      gradient.stops[0]?.id ?? "",
    );
    const [copied, setCopied] = React.useState(false);
    const copyTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const selectedStop =
      gradient.stops.find((stop) => stop.id === selectedId) ??
      gradient.stops[0];

    React.useEffect(() => {
      if (!gradient.stops.some((stop) => stop.id === selectedId)) {
        setSelectedId(gradient.stops[0]?.id ?? "");
      }
    }, [gradient.stops, selectedId]);

    React.useEffect(() => {
      return () => {
        if (copyTimeout.current) clearTimeout(copyTimeout.current);
      };
    }, []);

    const update = React.useCallback(
      (change: (current: GradientValue) => GradientValue) => {
        setGradient((current) =>
          normalizeValue(change(normalizeValue(current))),
        );
      },
      [setGradient],
    );

    const updateStop = (
      id: string,
      patch: Partial<Omit<GradientStop, "id">>,
    ) => {
      update((current) => ({
        ...current,
        stops: current.stops.map((stop) =>
          stop.id === id ? { ...stop, ...patch } : stop,
        ),
      }));
    };

    const applyPreset = (preset: GradientPreset) => {
      const next = presetValue(preset);
      setGradient(next);
      setSelectedId(next.stops[0]?.id ?? "");
    };

    const addStop = () => {
      const stop = nextStop(
        gradient.stops,
        idPrefix + "-stop-" + nextId.current++,
      );
      update((current) => ({ ...current, stops: [...current.stops, stop] }));
      setSelectedId(stop.id);
    };

    const removeStop = () => {
      if (!selectedStop || gradient.stops.length <= 2) return;
      const index = gradient.stops.findIndex(
        (stop) => stop.id === selectedStop.id,
      );
      const nextStops = gradient.stops.filter(
        (stop) => stop.id !== selectedStop.id,
      );
      const nextSelected = nextStops[Math.min(index, nextStops.length - 1)];
      update((current) => ({ ...current, stops: nextStops }));
      setSelectedId(nextSelected?.id ?? "");
    };

    const handleCopy = async () => {
      try {
        await copyToClipboard(css);
        setCopied(true);
        if (copyTimeout.current) clearTimeout(copyTimeout.current);
        copyTimeout.current = setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    };

    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className={cn(
          "flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-md",
          className,
          classNames?.root,
        )}
        style={{ ...style, ...styles?.root }}
      >
        {label && (
          <span
            id={labelId}
            className={cn("text-sm font-medium text-fg", classNames?.label)}
            style={styles?.label}
          >
            {label}
          </span>
        )}

        <div
          aria-label="Gradient preview"
          className={cn(
            "relative h-32 overflow-hidden rounded-lg shadow-inner",
            classNames?.preview,
          )}
          style={{ background: css, ...styles?.preview }}
        />

        {presets.length > 0 && (
          <div
            role="group"
            aria-label="Gradient presets"
            className={cn("grid grid-cols-3 gap-2", classNames?.presets)}
            style={styles?.presets}
          >
            {presets.map((preset) => {
              const presetGradient = presetValue(preset);
              const active = sameGradient(gradient, presetGradient);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  disabled={disabled}
                  aria-label={"Apply " + preset.name + " preset"}
                  aria-pressed={active}
                  title={preset.name}
                  className={cn(
                    "h-12 cursor-pointer rounded border border-border transition-shadow hover:shadow-lg",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    active && "ring-2 ring-ring ring-offset-2",
                    classNames?.preset,
                  )}
                  style={{
                    background: gradientToCss(presetGradient),
                    ...styles?.preset,
                  }}
                />
              );
            })}
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm font-medium text-fg">
          Type
          <select
            value={gradient.type}
            onChange={(event) =>
              update((current) => ({
                ...current,
                type: event.target.value === "radial" ? "radial" : "linear",
              }))
            }
            disabled={disabled}
            className={cn(
              "rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              classNames?.type,
            )}
            style={styles?.type}
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </label>

        <div
          className={cn(
            "relative h-10 rounded-md border border-border-strong",
            classNames?.stops,
          )}
          style={{ background: css, ...styles?.stops }}
          role="listbox"
          aria-label="Gradient stops"
        >
          {gradient.stops.map((stop, index) => {
            const selected = stop.id === selectedStop?.id;
            return (
              <button
                key={stop.id}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={
                  "Select stop " +
                  (index + 1) +
                  " at " +
                  Math.round(stop.position) +
                  "%"
                }
                onClick={() => setSelectedId(stop.id)}
                disabled={disabled}
                className={cn(
                  "absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full",
                  "border-2 border-surface shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  selected && "ring-2 ring-ring ring-offset-1",
                  classNames?.swatch,
                  classNames?.stop,
                )}
                style={{
                  left: clamp(stop.position, 0, 100) + "%",
                  backgroundColor: safeColor(stop.color),
                  ...styles?.swatch,
                  ...styles?.stop,
                }}
              />
            );
          })}
        </div>

        {selectedStop && (
          <div
            className={cn(
              "flex flex-col gap-3",
              classNames?.customColors,
              classNames?.stopControls,
            )}
            style={{ ...styles?.customColors, ...styles?.stopControls }}
          >
            <ColorPicker
              label="Stop color"
              value={selectedStop.color}
              onChange={(color) => updateStop(selectedStop.id, { color })}
              showInput
              showPresets={false}
              showValue={false}
              disabled={disabled}
              className={classNames?.colorPicker}
              style={styles?.colorPicker}
            />

            <Slider
              label="Stop position"
              min={0}
              max={100}
              step={1}
              suffix="%"
              value={selectedStop.position}
              onChange={(value) =>
                updateStop(selectedStop.id, {
                  position: sliderNumber(value, selectedStop.position),
                })
              }
              disabled={disabled}
              aria-label="Selected stop position"
              classNames={{ root: classNames?.position }}
              styles={{ root: styles?.position }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addStop}
                disabled={disabled}
                className={cn(
                  "rounded-md bg-primary-600 px-3 py-2 text-sm text-primary-fg",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  classNames?.addButton,
                )}
                style={styles?.addButton}
              >
                Add stop
              </button>
              <button
                type="button"
                onClick={removeStop}
                disabled={disabled || gradient.stops.length <= 2}
                className={cn(
                  "rounded-md border border-border-strong px-3 py-2 text-sm text-fg",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  classNames?.removeButton,
                )}
                style={styles?.removeButton}
              >
                Remove stop
              </button>
            </div>
          </div>
        )}

        {gradient.type === "linear" && (
          <Slider
            label="Angle"
            min={0}
            max={360}
            step={1}
            suffix={"\u00b0"}
            value={gradient.angle}
            onChange={(value) =>
              update((current) => ({
                ...current,
                angle: sliderNumber(value, current.angle),
              }))
            }
            disabled={disabled}
            aria-label="Gradient angle"
            classNames={{ root: classNames?.angle }}
            styles={{ root: styles?.angle }}
          />
        )}

        {showCopy && (
          <div
            className={cn("flex items-center gap-2", classNames?.copyRow)}
            style={styles?.copyRow}
          >
            <input
              type="text"
              value={css}
              readOnly
              aria-label="Gradient CSS"
              className={cn(
                "min-w-0 flex-1 rounded-md border border-border-strong bg-surface-sunken px-3 py-2 font-mono text-sm text-fg",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                classNames?.copyInput,
              )}
              style={styles?.copyInput}
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled || !css}
              aria-live="polite"
              className={cn(
                "rounded-md bg-primary-600 px-4 py-2 text-sm text-primary-fg transition-colors",
                "hover:bg-primary-700 focus:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                classNames?.copyButton,
              )}
              style={styles?.copyButton}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    );
  },
);

GradientMaker.displayName = "GradientMaker";

export default GradientMaker;
