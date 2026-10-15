"use client";

import * as React from "react";
import { cn, copyToClipboard, normalizeHex } from "../../utils";
import { useControllableState } from "../../hooks";
import { HexColorInput } from "./HexColorInput";

/** Stops are evenly spaced, in array order. */
export interface GradientValue {
  colors: string[];
  angle: number;
}
export interface GradientPreset {
  name: string;
  colors: string[];
  /** Omit to preserve the current angle when applying this preset. */
  angle?: number;
}
/** Inline DOM elements only; no component-owned portals. */
export interface GradientMakerClassNames {
  /** div: gradient-maker-root. */
  root?: string;
  /** span: gradient-maker-label. */
  label?: string;
  /** div: gradient-maker-preview. */
  preview?: string;
  /** div: gradient-maker-presets (visible nonempty presets only). */
  presets?: string;
  /** button: gradient-maker-preset; repeated, data-selected=true/false. */
  preset?: string;
  /** div: gradient-maker-custom-colors (showColors only). */
  customColors?: string;
  /** span: gradient-maker-colors-label. */
  colorsLabel?: string;
  /** div: gradient-maker-colors-list. */
  colorsList?: string;
  /** div: gradient-maker-color (repeated). */
  color?: string;
  /** label: gradient-maker-swatch (repeated). */
  swatch?: string;
  /** input[type=color]: gradient-maker-swatch-input (repeated). */
  swatchInput?: string;
  /** span: gradient-maker-swatch-color (repeated). */
  swatchColor?: string;
  /** input[type=text]: gradient-maker-hex-input (showHex only, repeated). */
  hexInput?: string;
  /** p: gradient-maker-hex-error (invalid HEX draft only, repeated). */
  hexError?: string;
  /** div: gradient-maker-angle (showAngle only). */
  angle?: string;
  /** label: gradient-maker-angle-label. */
  angleLabel?: string;
  /** input[type=range]: gradient-maker-angle-input. */
  angleInput?: string;
  /** output: gradient-maker-angle-value. */
  angleValue?: string;
  /** div: gradient-maker-copy-row (showCopy only). */
  copyRow?: string;
  /** input[type=text]: gradient-maker-copy-input (read-only). */
  copyInput?: string;
  /** button: gradient-maker-copy-button. */
  copyButton?: string;
  /** p: gradient-maker-copy-status (showCopy only). */
  copyStatus?: string;
}
export type GradientMakerStyles = {
  [Slot in keyof GradientMakerClassNames]?: React.CSSProperties;
};
export interface GradientMakerProps {
  label?: string;
  /** Controlled colors and angle. */
  value?: GradientValue;
  /** Initial uncontrolled colors and angle. Defaults to purple, 90 degrees. */
  defaultValue?: GradientValue;
  /** Structured value on edits. Does not fire on mount or external value updates. */
  onValueChange?: (value: GradientValue) => void;
  /** Compatible callback with complete CSS, on the same edits as onValueChange. */
  onGradientChange?: (gradient: string) => void;
  /** Replaces the built-ins. Empty/invalid presets are omitted; [] hides the section. */
  presets?: GradientPreset[];
  /** Show preset choices. Default true. */
  showPresets?: boolean;
  /** Show the color editors. Default true. */
  showColors?: boolean;
  /** Show the angle range and output. Default true. */
  showAngle?: boolean;
  /** Show HEX editors within the color section. Default true. */
  showHex?: boolean;
  /** Show CSS output, copying, and copy status. Default true. */
  showCopy?: boolean;
  /** Locks color, preset, and angle edits; copying remains available. */
  disabled?: boolean;
  /** Root classes, merged after defaults and classNames.root. */
  className?: string;
  classNames?: GradientMakerClassNames;
  styles?: GradientMakerStyles;
}

const DEFAULT_VALUE: GradientValue = {
  colors: ["#667eea", "#764ba2"],
  angle: 90,
};
const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "Purple Sunset", colors: ["#a8edea", "#fed6e3"] },
  { name: "Ocean Blue", colors: ["#2980b9", "#6dd5fa", "#ffffff"] },
  { name: "Sunset Orange", colors: ["#fa709a", "#fee140"] },
  { name: "Matrix Green", colors: ["#11998e", "#38ef7d"] },
  { name: "Dark Purple", colors: ["#30cfd0", "#330867"] },
  { name: "Pink Dream", colors: ["#a18cd1", "#fbc2eb"] },
  { name: "Teal Blue", colors: ["#84fab0", "#8fd3f4"] },
  { name: "Golden Hour", colors: ["#f093fb", "#f5576c"] },
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
  {
    name: "Pastel",
    colors: ["#f4e1e2", "#f5e6e3", "#eef3e5", "#d3e0e0", "#e4d3f4"],
  },
];
const normalizeAngle = (angle: number) =>
  Number.isFinite(angle) ? Math.min(360, Math.max(0, Math.round(angle))) : 90;
function normalizeValue(value: GradientValue): GradientValue {
  const colors = value.colors
    .map(normalizeHex)
    .filter((c): c is string => c !== null);
  return {
    colors: colors.length ? colors : [...DEFAULT_VALUE.colors],
    angle: normalizeAngle(value.angle),
  };
}
function buildGradient({ colors, angle }: GradientValue): string {
  const stops = colors.length === 1 ? [colors[0]!, colors[0]!] : colors;
  return `linear-gradient(${angle}deg, ${stops.map((color, index) => `${color} ${Math.round((index / (stops.length - 1)) * 100)}%`).join(", ")})`;
}
const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const disabledClasses = "disabled:cursor-not-allowed disabled:opacity-50";

const GradientMaker = React.forwardRef<HTMLDivElement, GradientMakerProps>(
  (
    {
      label = "Gradient",
      value,
      defaultValue = DEFAULT_VALUE,
      onValueChange,
      onGradientChange,
      presets = GRADIENT_PRESETS,
      showPresets = true,
      showColors = true,
      showAngle = true,
      showHex = true,
      showCopy = true,
      disabled = false,
      className,
      classNames,
      styles,
    },
    ref,
  ) => {
    const [state, setState] = useControllableState({
      value,
      defaultValue,
      onChange: (next: GradientValue) => {
        onValueChange?.(next);
        onGradientChange?.(buildGradient(next));
      },
    });
    const current = normalizeValue(state);
    const gradient = buildGradient(current);
    const id = React.useId();
    const [copyState, setCopyState] = React.useState<
      "idle" | "copied" | "error"
    >("idle");
    const copyAttempt = React.useRef(0);
    React.useEffect(() => {
      copyAttempt.current += 1;
      setCopyState("idle");
    }, [gradient]);
    React.useEffect(
      () => () => {
        copyAttempt.current += 1;
      },
      [],
    );
    React.useEffect(() => {
      if (copyState === "idle") return;
      const timer = setTimeout(() => setCopyState("idle"), 1800);
      return () => clearTimeout(timer);
    }, [copyState]);

    const slot = (key: keyof GradientMakerClassNames, defaults: string) => ({
      "data-slot": `gradient-maker-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
      className: cn(defaults, classNames?.[key]),
      style: styles?.[key],
    });
    const change = (next: GradientValue) => {
      if (!disabled) setState(normalizeValue(next));
    };
    const changeColor = (index: number, color: string) =>
      change({
        ...current,
        colors: current.colors.map((c, i) => (i === index ? color : c)),
      });
    const copy = async () => {
      const attempt = ++copyAttempt.current;
      try {
        await copyToClipboard(gradient);
        if (copyAttempt.current === attempt) setCopyState("copied");
      } catch {
        if (copyAttempt.current === attempt) setCopyState("error");
      }
    };

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label || "Gradient editor"}
        {...slot(
          "root",
          "flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm",
        )}
        className={cn(
          "flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm",
          classNames?.root,
          className,
        )}
      >
        {label && (
          <span {...slot("label", "text-sm font-semibold text-fg")}>
            {label}
          </span>
        )}
        <div
          role="img"
          aria-label={`Gradient preview: ${gradient}`}
          {...slot(
            "preview",
            "h-32 rounded-lg border border-border shadow-inner",
          )}
          style={{ background: gradient, ...styles?.preview }}
        />
        {showPresets && presets.length > 0 && (
          <div
            role="group"
            aria-label="Gradient presets"
            {...slot("presets", "grid grid-cols-3 gap-2")}
          >
            {presets
              .filter(
                (preset) =>
                  preset.colors.length > 0 &&
                  preset.colors.every((c) => normalizeHex(c) !== null),
              )
              .map((preset, index) => {
                const next = normalizeValue({
                  colors: preset.colors,
                  angle: preset.angle ?? current.angle,
                });
                const selected =
                  current.angle === next.angle &&
                  current.colors.length === next.colors.length &&
                  current.colors.every((c, i) => c === next.colors[i]);
                return (
                  <button
                    key={`${preset.name}-${index}`}
                    type="button"
                    disabled={disabled}
                    aria-label={`Apply ${preset.name} preset`}
                    title={preset.name}
                    aria-pressed={selected}
                    data-selected={selected}
                    {...slot(
                      "preset",
                      cn(
                        "h-12 cursor-pointer rounded-lg border border-border transition-shadow hover:shadow-md motion-reduce:transition-none",
                        focus,
                        disabledClasses,
                        selected && "ring-2 ring-ring ring-offset-2",
                      ),
                    )}
                    style={{
                      background: buildGradient(next),
                      ...styles?.preset,
                    }}
                    onClick={() => change(next)}
                  />
                );
              })}
          </div>
        )}
        {showColors && (
          <div {...slot("customColors", "flex flex-col gap-2")}>
            <span {...slot("colorsLabel", "text-sm font-medium text-fg")}>
              Custom colors
            </span>
            <div
              {...slot("colorsList", "grid grid-cols-2 gap-3 sm:grid-cols-3")}
            >
              {current.colors.map((color, index) => (
                <div
                  key={index}
                  {...slot("color", "flex min-w-0 flex-col gap-2")}
                >
                  <label
                    {...slot(
                      "swatch",
                      cn(
                        "relative block h-10 cursor-pointer overflow-hidden rounded-lg border border-border-strong focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                        disabled && "cursor-not-allowed opacity-50",
                      ),
                    )}
                  >
                    <input
                      type="color"
                      aria-label={`Color ${index + 1}`}
                      disabled={disabled}
                      value={color}
                      onChange={(event) =>
                        changeColor(index, event.target.value)
                      }
                      {...slot(
                        "swatchInput",
                        cn(
                          "absolute inset-0 h-full w-full cursor-pointer opacity-0",
                          disabledClasses,
                        ),
                      )}
                    />
                    <span
                      aria-hidden="true"
                      {...slot(
                        "swatchColor",
                        "pointer-events-none absolute inset-0",
                      )}
                      style={{ backgroundColor: color, ...styles?.swatchColor }}
                    />
                  </label>
                  {showHex && (
                    <HexColorInput
                      value={color}
                      onCommit={(hex) => changeColor(index, hex)}
                      disabled={disabled}
                      label={`Color ${index + 1} HEX`}
                      inputSlot="gradient-maker-hex-input"
                      errorSlot="gradient-maker-hex-error"
                      inputClassName={cn(
                        "w-full min-w-0 cursor-text rounded-md border border-border-strong bg-surface px-2 py-2 font-mono text-xs text-fg aria-invalid:border-danger-600",
                        focus,
                        disabledClasses,
                        classNames?.hexInput,
                      )}
                      errorClassName={cn(
                        "text-xs text-danger-600",
                        classNames?.hexError,
                      )}
                      inputStyle={styles?.hexInput}
                      errorStyle={styles?.hexError}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {showAngle && (
          <div
            {...slot("angle", "grid grid-cols-[1fr_auto] items-center gap-2")}
          >
            <label
              htmlFor={`${id}-angle`}
              {...slot("angleLabel", "text-sm font-medium text-fg")}
            >
              Angle
            </label>
            <output
              htmlFor={`${id}-angle`}
              {...slot("angleValue", "font-mono text-sm text-fg-muted")}
            >
              {current.angle}°
            </output>
            <input
              id={`${id}-angle`}
              type="range"
              min={0}
              max={360}
              step={1}
              value={current.angle}
              disabled={disabled}
              aria-label={`${label || "Gradient"} angle`}
              aria-valuetext={`${current.angle} degrees`}
              {...slot(
                "angleInput",
                cn(
                  "col-span-2 h-6 w-full cursor-pointer accent-primary-600",
                  focus,
                  disabledClasses,
                ),
              )}
              onChange={(event) =>
                change({ ...current, angle: Number(event.target.value) })
              }
            />
          </div>
        )}
        {showCopy && (
          <>
            <div {...slot("copyRow", "flex min-w-0 items-center gap-2")}>
              <input
                type="text"
                value={gradient}
                readOnly
                aria-label="Gradient CSS"
                {...slot(
                  "copyInput",
                  cn(
                    "w-0 min-w-0 flex-1 cursor-text rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 font-mono text-xs text-fg",
                    focus,
                  ),
                )}
              />
              <button
                type="button"
                onClick={copy}
                {...slot(
                  "copyButton",
                  cn(
                    "shrink-0 cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-700 motion-reduce:transition-none",
                    focus,
                  ),
                )}
              >
                {copyState === "copied" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p
              role="status"
              {...slot(
                "copyStatus",
                cn(
                  "min-h-4 text-xs text-fg-muted",
                  copyState === "error" && "text-danger-600",
                ),
              )}
            >
              {copyState === "copied"
                ? "Gradient CSS copied."
                : copyState === "error"
                  ? "Copy failed. Select the CSS and copy it manually."
                  : ""}
            </p>
          </>
        )}
      </div>
    );
  },
);
GradientMaker.displayName = "GradientMaker";
export default GradientMaker;
