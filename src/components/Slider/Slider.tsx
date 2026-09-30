"use client";

import React from "react";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showValue?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export default function Slider({
  defaultValue,  // Exclude this to prevent React warning
  label,
  showValue = true,
  className = "",
  min = 0,
  max = 100,
  step = 1,
  prefix,
  suffix,
  value,
  ...props
}: SliderProps) {
  const [displayValue, setDisplayValue] = React.useState(() => value ?? min);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = props.onChange?.(e);
    if (newValue !== undefined) {
      setDisplayValue(newValue);
    } else {
      setDisplayValue(Number(e.target.value));
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {prefix && <span className="text-gray-500 mr-1">{prefix}</span>}
          {label}
          {suffix && <span className="text-gray-500 ml-1">{suffix}</span>}
        </label>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        disabled={props.disabled}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500
          hover:bg-gray-300 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      {showValue && (
        <span className="text-xs font-mono text-gray-600 text-right">
          {prefix}{displayValue}{suffix}
        </span>
      )}
    </div>
  );
}
