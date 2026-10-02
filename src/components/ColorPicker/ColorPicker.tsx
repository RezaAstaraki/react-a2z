'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface ColorPickerProps {
  label?: string;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onChange?: (color: string) => void;
  presetColors?: string[];
  showPresets?: boolean;
  /** Whether to render the "Selected: #rrggbb" line. Defaults to true. */
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
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
    },
    forwardedRef,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const color = isControlled ? controlledValue : uncontrolled;

    const inputId = React.useId();

    const commitColor = React.useCallback(
      (next: string) => {
        if (!isControlled) setUncontrolled(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      commitColor(e.target.value);
    };

    // Normalize for comparison — browsers may return different casings.
    const normalized = color.toLowerCase().trim();

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
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
              'h-10 w-10 cursor-pointer rounded border border-gray-300 p-1',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />

          {showPresets && presetColors.length > 0 && (
            <div role="group" aria-label="Preset colors" className="flex flex-wrap gap-2">
              {presetColors.map((c) => {
                const isSelected = normalized === c.toLowerCase().trim();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => commitColor(c)}
                    disabled={disabled}
                    aria-label={`Select color ${c}`}
                    aria-pressed={isSelected}
                    className={cn(
                      'h-6 w-6 rounded border border-gray-300 transition-shadow',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected && 'ring-2 ring-blue-500 ring-offset-1',
                    )}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {showValue && (
          <span className="text-sm text-gray-600">
            Selected: <span className="font-mono">{color}</span>
          </span>
        )}
      </div>
    );
  },
);

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
