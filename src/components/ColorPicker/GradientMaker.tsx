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
  /** Optional visible/tooltip name; unnamed choices receive a numbered accessible label. */
  name?: string;
  colors: string[];
  /** Omit to preserve the current angle when applying; thumbnails default to 90 degrees. */
  angle?: number;
}
/** Inline DOM elements only; no component-owned portals. */
export interface GradientMakerClassNames {
  /** div: gradient-maker-root. */
  root?: string;
  /** span: gradient-maker-label. */
  label?: string;
  /** div: gradient-maker-header, label and history controls. */
  header?: string;
  /** div: gradient-maker-preview. */
  preview?: string;
  /** div: gradient-maker-presets (visible nonempty presets only). */
  presets?: string;
  /** button: gradient-maker-preset; repeated, data-selected=true/false. */
  preset?: string;
  /** span: gradient-maker-preset-name (showPresetNames and a nonblank name only). */
  presetName?: string;
  /** div: gradient-maker-custom-colors (showColors only). */
  customColors?: string;
  /** span: gradient-maker-colors-label. */
  colorsLabel?: string;
  /** div: gradient-maker-colors-header (showColors only). */
  colorsHeader?: string;
  /** button: gradient-maker-add-color (showColors and showColorActions only). */
  addColor?: string;
  /** p: gradient-maker-colors-hint (showColors and showColorActions only). */
  colorsHint?: string;
  /** p[role=status]: gradient-maker-colors-status, visually hidden announcements. */
  colorsStatus?: string;
  /** div: gradient-maker-colors-list. */
  colorsList?: string;
  /** div: gradient-maker-color (repeated). */
  color?: string;
  /** div: gradient-maker-color-header (showColorActions only, repeated). */
  colorHeader?: string;
  /** span: gradient-maker-color-label (showColorActions only, repeated). */
  colorLabel?: string;
  /** div: gradient-maker-color-actions (showColorActions only, repeated). */
  colorActions?: string;
  /** button: gradient-maker-move-color-button, repeated earlier/later controls. */
  moveColorButton?: string;
  /** button: gradient-maker-remove-color-button (showColorActions only, repeated). */
  removeColorButton?: string;
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
  /** div: gradient-maker-angle-controls. */
  angleControls?: string;
  /** input[type=number]: gradient-maker-angle-number (showAngleNumber only). */
  angleNumber?: string;
  /** p: gradient-maker-angle-error; reserved validation space. */
  angleError?: string;
  /** div: gradient-maker-history (showHistory only). */
  history?: string;
  /** button: gradient-maker-undo-button. */
  undoButton?: string;
  /** button: gradient-maker-redo-button. */
  redoButton?: string;
  /** span: gradient-maker-undo-icon, decorative custom icon wrapper. */
  undoIcon?: string;
  /** span: gradient-maker-redo-icon, decorative custom icon wrapper. */
  redoIcon?: string;
  /** span: gradient-maker-undo-label (nonblank undoLabel only). */
  undoLabel?: string;
  /** span: gradient-maker-redo-label (nonblank redoLabel only). */
  redoLabel?: string;
  /** p[role=status]: gradient-maker-history-status, visually hidden. */
  historyStatus?: string;
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
  /** Show supplied nonblank names inside preset thumbnails. Default false; requires showPresets. */
  showPresetNames?: boolean;
  /** Show the color editors. Default true. */
  showColors?: boolean;
  /** Show add/remove/reorder controls with the color editors. Default true. */
  showColorActions?: boolean;
  /** Adding stops is capped here (integer clamped to 1–32, default 32). Existing values/presets are never truncated. */
  maxColors?: number;
  /** Show the angle controls and output. Default true. */
  showAngle?: boolean;
  /** Show a numeric angle editor beside the slider (showAngle only). Default true. */
  showAngleNumber?: boolean;
  /** Show undo/redo for the last 50 gradient edits. External value changes reset history. Default true. */
  showHistory?: boolean;
  /** Visible undo text; use an empty string for an icon-only button. Default Undo. */
  undoLabel?: string;
  /** Visible redo text; use an empty string for an icon-only button. Default Redo. */
  redoLabel?: string;
  /** Decorative undo content (e.g. SVG); null hides the icon. Default ↶. */
  undoIcon?: React.ReactNode;
  /** Decorative redo content (e.g. SVG); null hides the icon. Default ↷. */
  redoIcon?: React.ReactNode;
  /** Accessible undo button name, including when visible text is hidden. Default Undo gradient edit. */
  undoAriaLabel?: string;
  /** Accessible redo button name, including when visible text is hidden. Default Redo gradient edit. */
  redoAriaLabel?: string;
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
  { name: "Sunset Orange", colors: ["#fa709a", "#fee140"] },
  { name: "Ocean Blue", colors: ["#2980b9", "#6dd5fa", "#ffffff"] },
  {
    name: "Rainbow",
    colors: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"],
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
const sameValue = (a: GradientValue, b: GradientValue) =>
  a.angle === b.angle && a.colors.length === b.colors.length &&
  a.colors.every((color, index) => color === b.colors[index]);
type GradientHistory = { past: GradientValue[]; present: GradientValue; future: GradientValue[] };

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
      showPresetNames = false,
      showColors = true,
      showColorActions = true,
      maxColors = 32,
      showAngle = true,
      showAngleNumber = true,
      showHistory = true,
      undoLabel = "Undo",
      redoLabel = "Redo",
      undoIcon = "↶",
      redoIcon = "↷",
      undoAriaLabel = "Undo gradient edit",
      redoAriaLabel = "Redo gradient edit",
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
    const [history, setHistory] = React.useState<GradientHistory>(() => ({ past: [], present: current, future: [] }));
    const historyMatches = sameValue(history.present, current);
    const canUndo = historyMatches && history.past.length > 0;
    const canRedo = historyMatches && history.future.length > 0;
    const gesture = React.useRef<{ start: GradientHistory | null } | null>(null);
    const beginGesture = () => { gesture.current ??= { start: null }; };
    const endGesture = () => { gesture.current = null; };
    const finishGesture = () => {
      const start = gesture.current?.start;
      endGesture();
      if (start) setHistory((previous) =>
        sameValue(start.present, previous.present) ? start : previous,
      );
    };
    React.useEffect(() => {
      if (!historyMatches) {
        setHistory({ past: [], present: current, future: [] });
        endGesture();
      }
    });
    const [historyAnnouncement, setHistoryAnnouncement] = React.useState("");
    const [angleDraft, setAngleDraft] = React.useState<{ text: string; source: string; invalid: boolean } | null>(null);
    const currentKey = JSON.stringify(current);
    const activeAngleDraft = angleDraft?.source === currentKey ? angleDraft : null;
    React.useEffect(() => {
      setAngleDraft((draft) => draft?.source === currentKey ? draft : null);
    }, [currentKey]);
    const colorLimit = Number.isFinite(maxColors)
      ? Math.min(32, Math.max(1, Math.floor(maxColors)))
      : 32;
    const gradient = buildGradient(current);
    const id = React.useId();
    const [copyState, setCopyState] = React.useState<
      "idle" | "copied" | "error"
    >("idle");
    const copyAttempt = React.useRef(0);
    const [colorAnnouncement, setColorAnnouncement] = React.useState("");
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
    const change = (next: GradientValue, grouped = false) => {
      if (disabled) return;
      const normalized = normalizeValue(next);
      if (sameValue(current, normalized)) return;
      const baseline = historyMatches ? history : { past: [], present: current, future: [] };
      const continueGesture = grouped && gesture.current?.start;
      setHistory({
        past: continueGesture ? baseline.past : [...baseline.past, current].slice(-50),
        present: normalized,
        future: [],
      });
      if (grouped && gesture.current) gesture.current.start ??= baseline;
      else endGesture();
      setAngleDraft(null);
      setHistoryAnnouncement("");
      setState(normalized);
    };
    const changeColor = (index: number, color: string, grouped = false) =>
      change({
        ...current,
        colors: current.colors.map((c, i) => (i === index ? color : c)),
      }, grouped);
    const restoreHistory = (direction: "undo" | "redo") => {
      if (disabled || !historyMatches) return;
      const entries = direction === "undo" ? history.past : history.future;
      const next = entries[entries.length - 1];
      if (!next) return;
      endGesture();
      setAngleDraft(null);
      setHistory(direction === "undo"
        ? { past: history.past.slice(0, -1), present: next, future: [...history.future, current] }
        : { past: [...history.past, current].slice(-50), present: next, future: history.future.slice(0, -1) });
      setHistoryAnnouncement(direction === "undo" ? "Undid gradient edit." : "Redid gradient edit.");
      setState(next);
    };
    const commitAngle = (text: string) => {
      if (disabled) return;
      const angle = text.trim() ? Number(text) : NaN;
      if (!Number.isInteger(angle) || angle < 0 || angle > 360) {
        setAngleDraft({ text, source: currentKey, invalid: true });
        return;
      }
      change({ ...current, angle }, true);
      setAngleDraft(null);
    };
    const focusColor = (trigger: HTMLButtonElement, index: number) => {
      const root = trigger.closest('[data-slot="gradient-maker-root"]');
      requestAnimationFrame(() => {
        root?.querySelector<HTMLInputElement>(
          `[data-color-index="${index}"] [data-slot="gradient-maker-swatch-input"]`,
        )?.focus();
      });
    };
    const addColor = (trigger: HTMLButtonElement) => {
      if (disabled || current.colors.length >= colorLimit) return;
      change({ ...current, colors: [...current.colors, "#ffffff"] });
      setColorAnnouncement(`Added color ${current.colors.length + 1}.`);
      focusColor(trigger, current.colors.length);
    };
    const removeColor = (trigger: HTMLButtonElement, index: number) => {
      if (disabled || current.colors.length <= 1) return;
      change({ ...current, colors: current.colors.filter((_, i) => i !== index) });
      const remaining = current.colors.length - 1;
      setColorAnnouncement(`Removed color ${index + 1}. ${remaining} ${remaining === 1 ? "color remains" : "colors remain"}.`);
      focusColor(trigger, Math.min(index, current.colors.length - 2));
    };
    const moveColor = (trigger: HTMLButtonElement, index: number, direction: -1 | 1) => {
      const destination = index + direction;
      if (disabled || destination < 0 || destination >= current.colors.length) return;
      const colors = [...current.colors];
      [colors[index], colors[destination]] = [colors[destination]!, colors[index]!];
      change({ ...current, colors });
      setColorAnnouncement(`Moved color ${index + 1} to position ${destination + 1} of ${colors.length}.`);
      focusColor(trigger, destination);
    };
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
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (!showHistory || !(event.ctrlKey || event.metaKey) || event.altKey ||
            target.closest('input:not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]')) return;
          const key = event.key.toLowerCase();
          const direction = key === "z" ? (event.shiftKey ? "redo" : "undo") : key === "y" ? "redo" : null;
          if (direction && !disabled && (direction === "undo" ? canUndo : canRedo)) {
            event.preventDefault();
            restoreHistory(direction);
          }
        }}
        {...slot(
          "root",
          "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm",
        )}
        className={cn(
          "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm",
          classNames?.root,
          className,
        )}
      >
        {(label || showHistory) && (
          <div {...slot("header", "flex flex-wrap items-center justify-between gap-2")}>
            {label && (
              <span {...slot("label", "text-sm font-semibold text-fg")}>
                {label}
              </span>
            )}
            {showHistory && (
              <div {...slot("history", "flex min-w-0 max-w-full flex-wrap items-center gap-2")}>
                {(["undo", "redo"] as const).map((direction) => {
                  const isUndo = direction === "undo";
                  const icon = isUndo ? undoIcon : redoIcon;
                  const text = isUndo ? undoLabel : redoLabel;
                  const hasIcon = icon != null && typeof icon !== "boolean" && icon !== "";
                  return (
                  <button key={direction} type="button"
                    aria-label={(isUndo ? undoAriaLabel : redoAriaLabel).trim() || `${isUndo ? "Undo" : "Redo"} gradient edit`}
                    disabled={disabled || !(direction === "undo" ? canUndo : canRedo)}
                    {...slot(direction === "undo" ? "undoButton" : "redoButton", cn(
                      "inline-flex min-h-7 min-w-7 max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-fg hover:bg-surface-sunken",
                      focus, disabledClasses,
                    ))}
                    onClick={() => restoreHistory(direction)}
                  >
                    {hasIcon && (
                      <span aria-hidden="true" {...slot(isUndo ? "undoIcon" : "redoIcon", "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full")}>
                        {icon}
                      </span>
                    )}
                    {text.trim() && (
                      <span {...slot(isUndo ? "undoLabel" : "redoLabel", "min-w-0 truncate")}>
                        {text}
                      </span>
                    )}
                  </button>
                  );
                })}
                <p role="status" {...slot("historyStatus", "sr-only")}>{historyAnnouncement}</p>
              </div>
            )}
          </div>
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
                const presetName = typeof preset.name === "string" ? preset.name.trim() : "";
                const next = normalizeValue({
                  colors: preset.colors,
                  angle: preset.angle ?? current.angle,
                });
                const thumbnail = {
                  ...next,
                  angle: normalizeAngle(preset.angle ?? DEFAULT_VALUE.angle),
                };
                const selected =
                  current.angle === next.angle &&
                  current.colors.length === next.colors.length &&
                  current.colors.every((c, i) => c === next.colors[i]);
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={disabled}
                    aria-label={presetName ? `Apply ${presetName} preset` : `Apply gradient preset ${index + 1}`}
                    title={presetName || `Gradient preset ${index + 1}`}
                    aria-pressed={selected}
                    data-selected={selected}
                    {...slot(
                      "preset",
                      cn(
                        "flex h-12 min-w-0 cursor-pointer items-end rounded-lg border border-border p-1.5 text-left transition-shadow hover:shadow-md motion-reduce:transition-none",
                        focus,
                        disabledClasses,
                        selected && "ring-2 ring-ring ring-offset-2",
                      ),
                    )}
                    style={{
                      background: buildGradient(thumbnail),
                      ...styles?.preset,
                    }}
                    onClick={() => change(next)}
                  >
                    {showPresetNames && presetName && (
                      <span {...slot("presetName", "block max-w-full truncate rounded bg-surface/95 px-1.5 py-0.5 text-xs font-medium text-fg shadow-sm")}>
                        {presetName}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
        {showColors && (
          <div {...slot("customColors", "flex flex-col gap-2")}>
            <div {...slot("colorsHeader", "flex flex-wrap items-center justify-between gap-2")}>
              <span {...slot("colorsLabel", "text-sm font-medium text-fg")}>
                Color stops
              </span>
              {showColorActions && (
                <button
                  type="button"
                  aria-label="Add color stop"
                  title={current.colors.length >= colorLimit ? `Add limit reached (${colorLimit} colors)` : "Add a white color stop"}
                  disabled={disabled || current.colors.length >= colorLimit}
                  {...slot("addColor", cn(
                    "cursor-pointer rounded-md border border-border-strong bg-surface px-2 py-1 text-xs font-medium text-fg hover:bg-surface-sunken",
                    focus, disabledClasses,
                  ))}
                  onClick={(event) => addColor(event.currentTarget)}
                >
                  + Add color
                </button>
              )}
            </div>
            {showColorActions && (
              <p {...slot("colorsHint", "text-xs text-fg-muted")}>
                Evenly spaced · add limit {colorLimit}
              </p>
            )}
            <div
              {...slot("colorsList", "grid grid-cols-2 gap-3 sm:grid-cols-3")}
            >
              {current.colors.map((color, index) => (
                <div
                  key={index}
                  data-color-index={index}
                  {...slot("color", "flex min-w-0 flex-col gap-2")}
                >
                  {showColorActions && (
                    <div {...slot("colorHeader", "flex flex-wrap items-center justify-between gap-1")}>
                      <span {...slot("colorLabel", "text-xs font-medium text-fg-muted")}>
                        {index + 1}
                      </span>
                      <div {...slot("colorActions", "flex items-center gap-1")}>
                        {([-1, 1] as const).map((direction) => (
                          <button
                            key={direction}
                            type="button"
                            aria-label={`Move color ${index + 1} ${direction === -1 ? "earlier" : "later"}`}
                            title={`Move color ${index + 1} ${direction === -1 ? "earlier" : "later"}`}
                            disabled={disabled || (direction === -1 ? index === 0 : index === current.colors.length - 1)}
                            {...slot("moveColorButton", cn(
                              "h-6 w-6 cursor-pointer rounded border border-border bg-surface text-xs text-fg hover:bg-surface-sunken",
                              focus, disabledClasses,
                            ))}
                            onClick={(event) => moveColor(event.currentTarget, index, direction)}
                          >
                            {direction === -1 ? "←" : "→"}
                          </button>
                        ))}
                        <button
                          type="button"
                          aria-label={`Remove color ${index + 1}`}
                          title={current.colors.length === 1 ? "Keep at least one color" : `Remove color ${index + 1}`}
                          disabled={disabled || current.colors.length === 1}
                          {...slot("removeColorButton", cn(
                            "h-6 w-6 cursor-pointer rounded border border-border bg-surface text-sm text-fg hover:border-danger-600 hover:text-danger-600",
                            focus, disabledClasses,
                          ))}
                          onClick={(event) => removeColor(event.currentTarget, index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
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
                      onFocus={beginGesture}
                      onBlur={finishGesture}
                      onChange={(event) =>
                        changeColor(index, event.target.value, true)
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
            {showColorActions && (
              <p role="status" {...slot("colorsStatus", "sr-only")}>
                {colorAnnouncement}
              </p>
            )}
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
            <div {...slot("angleControls", "flex items-center gap-2")}>
              {showAngleNumber && (
                <input type="number" min={0} max={360} step={1}
                  aria-label={`${label || "Gradient"} angle in degrees`}
                  aria-invalid={activeAngleDraft?.invalid || undefined}
                  aria-describedby={`${id}-angle-error`}
                  disabled={disabled}
                  value={activeAngleDraft?.text ?? String(current.angle)}
                  {...slot("angleNumber", cn(
                    "w-20 min-w-0 cursor-text rounded-md border border-border-strong bg-surface px-2 py-1 font-mono text-sm text-fg aria-invalid:border-danger-600",
                    focus, disabledClasses,
                  ))}
                  onFocus={beginGesture}
                  onChange={(event) => {
                    if (disabled) return;
                    beginGesture();
                    const text = event.target.value;
                    const angle = text.trim() ? Number(text) : NaN;
                    if (Number.isInteger(angle) && angle >= 0 && angle <= 360) {
                      const next = { ...current, angle };
                      change(next, true);
                      setAngleDraft({ text, source: JSON.stringify(next), invalid: false });
                    } else {
                      setAngleDraft({ text, source: currentKey, invalid: false });
                    }
                  }}
                  onBlur={(event) => {
                    if (activeAngleDraft) commitAngle(event.target.value);
                    finishGesture();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") { event.preventDefault(); commitAngle(event.currentTarget.value); finishGesture(); }
                    if (event.key === "Escape") { event.preventDefault(); setAngleDraft(null); finishGesture(); }
                  }}
                />
              )}
              <output
                htmlFor={`${id}-angle`}
                aria-label={`Current angle: ${current.angle} degrees`}
                {...slot("angleValue", "font-mono text-sm text-fg-muted")}
              >
                {showAngleNumber ? "°" : `${current.angle}°`}
              </output>
            </div>
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
              onPointerDown={beginGesture}
              onPointerUp={finishGesture}
              onPointerCancel={finishGesture}
              onBlur={finishGesture}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) beginGesture();
              }}
              onKeyUp={finishGesture}
              {...slot(
                "angleInput",
                cn(
                  "col-span-2 h-6 w-full cursor-pointer accent-primary-600",
                  focus,
                  disabledClasses,
                ),
              )}
              onChange={(event) =>
                change({ ...current, angle: Number(event.target.value) }, true)
              }
            />
            {showAngleNumber && (
              <p id={`${id}-angle-error`} aria-live="polite" {...slot("angleError", "col-span-2 min-h-4 text-xs text-danger-600")}>
                {activeAngleDraft?.invalid ? "Enter a whole number from 0 to 360." : ""}
              </p>
            )}
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
