'use client';

import * as React from 'react';
import { cn, normalizeHex } from '../../utils';
import { useControllableState } from '../../hooks';

export interface ColorPickerClassNames {
  root?: string;
  label?: string;
  input?: string;
  presets?: string;
  preset?: string;
  value?: string;
}

export interface ColorPickerStyles {
  root?: React.CSSProperties;
  label?: React.CSSProperties;
  input?: React.CSSProperties;
  presets?: React.CSSProperties;
  preset?: React.CSSProperties;
  value?: React.CSSProperties;
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
  /** Whether to render the preset swatch row. Defaults to true. */
  showPresets?: boolean;
  /** Whether to render the "Selected: #rrggbb" line. Defaults to true. */
  showValue?: boolean;
  /** Disables the input and every preset swatch. */
  disabled?: boolean;
  /** Merged onto the root, before `classNames.root` -- so `classNames.root` wins on conflict. */
  className?: string;
  /** Per-slot class overrides for the six internal slots. */
  classNames?: ColorPickerClassNames;
  /** Per-slot inline styles for the six internal slots. */
  styles?: ColorPickerStyles;
}

const DEFAULT_PRESETS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
];

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      label = 'Color',
      value: controlledValue,
      defaultValue = '#ff0000',
      onChange,
      presetColors = DEFAULT_PRESETS,
      showPresets = true,
      showValue = true,
      disabled = false,
      className,
      classNames,
      styles,
    },
    forwardedRef,
  ) => {
  const [color, setColor] = useControllableState<string>({
    value: controlledValue,
    defaultValue,
    onChange,
  });

  const inputId = React.useId();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  // Compare normalized values — browsers may return different casings, and
  // consumers may pass `#ABC` while the preset list holds `#aabbcc`.
  const normalized = normalizeHex(color);

  return (
    <div
      className={cn('flex flex-col gap-2', className, classNames?.root)}
      style={styles?.root}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cn('text-sm font-medium text-fg', classNames?.label)}
          style={styles?.label}
        >
          {label}
        </label>
      )}

      <div className="flex flex-col gap-3">
        <input
          id={inputId}
          ref={forwardedRef}
          type="color"
          value={color}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'h-10 w-10 cursor-pointer rounded-md border border-border-strong p-1',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            classNames?.input,
          )}
          style={styles?.input}
        />

        {showPresets && presetColors.length > 0 && (
          <div
            role="group"
            aria-label="Preset colors"
            className={cn('flex flex-wrap gap-2', classNames?.presets)}
            style={styles?.presets}
          >
            {presetColors.map((c) => {
              const isSelected = normalized !== null && normalized === normalizeHex(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  disabled={disabled}
                  aria-label={`Select color ${c}`}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-6 w-6 rounded-full border border-border-strong transition-shadow',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected && 'ring-2 ring-ring ring-offset-1',
                    classNames?.preset,
                  )}
                  style={{ backgroundColor: c, ...styles?.preset }}
                />
              );
            })}
          </div>
        )}
      </div>

      {showValue && (
        <span className={cn('text-sm text-fg-muted', classNames?.value)} style={styles?.value}>
          Selected: <span className="font-mono">{color}</span>
        </span>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
