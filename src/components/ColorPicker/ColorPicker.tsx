"use client";

import * as React from "react";
import { cn, normalizeHex } from "../../utils";
import { useControllableState } from "../../hooks";

export interface ColorPickerClassNames {
  root?: string;
  label?: string;
  control?: string;
  input?: string;
  textInput?: string;
  presets?: string;
  preset?: string;
  value?: string;
  error?: string;
}

export interface ColorPickerStyles {
  root?: React.CSSProperties;
  label?: React.CSSProperties;
  control?: React.CSSProperties;
  input?: React.CSSProperties;
  textInput?: React.CSSProperties;
  presets?: React.CSSProperties;
  preset?: React.CSSProperties;
  value?: React.CSSProperties;
  error?: React.CSSProperties;
}

export interface ColorPickerProps {
  /** Label above the swatch. Default `"Color"`. */
  label?: string;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. Default `"#ff0000"`. */
  defaultValue?: string;
  /** Called with the new hex string when the input or a preset changes. */
  onChange?: (color: string) => void;
  /** Swatch-row colours. Defaults to eight built-ins; `[]` hides the row. */
  presetColors?: string[];
  /** Whether to render an editable hex field beside the native picker. Defaults to false. */
  showInput?: boolean;
  /** Whether to render the preset swatch row. Defaults to true. */
  showPresets?: boolean;
  /** Whether to render the "Selected: #rrggbb" line. Defaults to true. */
  showValue?: boolean;
  /** Disables the input and every preset swatch. */
  disabled?: boolean;
  /** Accessible label for the editable hex field. Defaults to "Hex color". */
  inputLabel?: string;
  /** Merged onto the root, before `classNames.root` -- so `classNames.root` wins on conflict. */
  className?: string;
  /** Inline style on the root. */
  style?: React.CSSProperties;
  /** Per-slot class overrides. */
  classNames?: ColorPickerClassNames;
  /** Per-slot inline styles. */
  styles?: ColorPickerStyles;
}

const DEFAULT_PRESETS = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      label = "Color",
      value: controlledValue,
      defaultValue = "#ff0000",
      onChange,
      presetColors = DEFAULT_PRESETS,
      showPresets = true,
      showInput = false,
      showValue = true,
      disabled = false,
      inputLabel = "Hex color",
      className,
      style,
      classNames,
      styles,
    },
    forwardedRef,
  ) => {
    const [color, setColor] = useControllableState<string>({
      value: controlledValue,
      defaultValue: normalizeHex(defaultValue) ?? "#ff0000",
      onChange,
    });

    const normalizedColor =
      normalizeHex(color) ?? normalizeHex(defaultValue) ?? "#ff0000";
    const [draft, setDraft] = React.useState(normalizedColor);
    const inputId = React.useId();
    const errorId = React.useId();

    React.useEffect(() => {
      setDraft(normalizedColor);
    }, [normalizedColor]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = normalizeHex(e.target.value);
      if (!next) return;
      setDraft(next);
      setColor(next);
    };

    const commitDraft = () => {
      const next = normalizeHex(draft);
      if (!next) {
        setDraft(normalizedColor);
        return;
      }
      setDraft(next);
      setColor(next);
    };

    const handleTextKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        commitDraft();
        event.currentTarget.select();
      }
      if (event.key === "Escape") {
        setDraft(normalizedColor);
        event.currentTarget.blur();
      }
    };
    const invalidDraft =
      showInput && draft.length > 0 && normalizeHex(draft) === null;

    // Compare normalized values — browsers may return different casings, and
    // consumers may pass `#ABC` while the preset list holds `#aabbcc`.
    const normalized = normalizeHex(color);

    return (
      <div
        className={cn("flex flex-col gap-2", className, classNames?.root)}
        style={{ ...style, ...styles?.root }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn("text-sm font-medium text-fg", classNames?.label)}
            style={styles?.label}
          >
            {label}
          </label>
        )}

        <div
          className={cn("flex flex-col gap-3", classNames?.control)}
          style={styles?.control}
        >
          <input
            id={inputId}
            ref={forwardedRef}
            type="color"
            value={normalizedColor}
            onChange={handleInputChange}
            disabled={disabled}
            aria-label={label || "Choose color"}
            className={cn(
              "h-10 w-10 cursor-pointer rounded-md border border-border-strong p-1",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              classNames?.input,
            )}
            style={styles?.input}
          />

          {showInput && (
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={handleTextKeyDown}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              aria-label={inputLabel}
              aria-invalid={invalidDraft || undefined}
              aria-describedby={invalidDraft ? errorId : undefined}
              className={cn(
                "min-w-0 rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-sm text-fg",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                invalidDraft && "border-danger-600",
                classNames?.textInput,
              )}
              style={styles?.textInput}
            />
          )}

          {invalidDraft && (
            <span
              id={errorId}
              role="alert"
              className={cn("text-xs text-danger-600", classNames?.error)}
              style={styles?.error}
            >
              Enter a 3- or 6-digit hex color.
            </span>
          )}

          {showPresets && presetColors.length > 0 && (
            <div
              role="group"
              aria-label="Preset colors"
              className={cn("flex flex-wrap gap-2", classNames?.presets)}
              style={styles?.presets}
            >
              {presetColors.map((c) => {
                const isSelected =
                  normalized !== null && normalized === normalizeHex(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(normalizeHex(c) ?? normalizedColor)}
                    disabled={disabled || normalizeHex(c) === null}
                    aria-label={`Select color ${c}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "h-6 w-6 cursor-pointer rounded-full border border-border-strong transition-shadow",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected && "ring-2 ring-ring ring-offset-1",
                      classNames?.preset,
                    )}
                    style={{
                      backgroundColor: normalizeHex(c) ?? "transparent",
                      ...styles?.preset,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {showValue && (
          <span
            className={cn("text-sm text-fg-muted", classNames?.value)}
            style={styles?.value}
          >
            Selected: <span className="font-mono">{normalizedColor}</span>
          </span>
        )}
      </div>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
