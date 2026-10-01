"use client";

import React, { useState } from "react";

export interface ColorPickerProps {
  label?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
  presetColors?: string[];
  showPresets?: boolean;
}

export default function ColorPicker({
  label = "Color",
  defaultValue = "#ff0000",
  onChange,
  presetColors,
  showPresets = true,
}: ColorPickerProps) {
  const [color, setColor] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onChange?.(newColor);
  };


  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex flex-col gap-2">
        <input
          type="color"
          value={color}
          onChange={handleChange}
          className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
        />
        <div className="flex flex-wrap gap-2">
          {(presetColors || ['#ff0000', '#00ff00']).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleChange({ target: { value: c } } as React.ChangeEvent<HTMLInputElement>)}
              className={`w-6 h-6 border rounded ${
                color === c ? "ring-2 ring-blue-500" : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>
      {label && (
        <span className="text-sm text-gray-600">
          Selected: <span className="font-mono">{color}</span>
        </span>
      )}
    </div>
  );
}
