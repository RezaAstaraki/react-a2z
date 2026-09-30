"use client";

import React, { useState } from "react";
import Slider from "../Slider/Slider";

// Predefined gradient presets inspired by cssgradient.io
const GRADIENT_PRESETS = [
  { name: "Purple Sunset", colors: ["#a8edea", "#fed6e3"], type: "linear" },
  { name: "Ocean Blue", colors: ["#2980b9", "#6dd5fa", "#ffffff"], type: "linear" },
  { name: "Sunset Orange", colors: ["#fa709a", "#fee140"], type: "linear" },
  { name: "Matrix Green", colors: ["#11998e", "#38ef7d"], type: "linear" },
  { name: "Dark Purple", colors: ["#30cfd0", "#330867"], type: "linear" },
  { name: "Pink Dream", colors: ["#a18cd1", "#fbc2eb"], type: "linear" },
  { name: "Teal Blue", colors: ["#84fab0", "#8fd3f4"], type: "linear" },
  { name: "Golden Hour", colors: ["#f093fb", "#f5576c"], type: "linear" },
  { name: "Midnight", colors: ["#232526", "#414345"], type: "linear" },
  { name: "Rainbow", colors: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"], type: "linear" },
  { name: "Pastel", colors: ["#f4e1e2", "#f5e6e3", "#eef3e5", "#d3e0e0", "#e4d3f4"], type: "linear" },
];

export interface GradientMakerProps {
  label?: string;
  onGradientChange?: (gradient: string) => void;
}

export default function GradientMaker({
  label = "Gradient",
  onGradientChange,
}: GradientMakerProps) {
  const [customColors, setCustomColors] = useState<string[]>(["#667eea", "#764ba2"]);
  const [angle, setAngle] = useState(90);
  const [selectedGradient, setSelectedGradient] = useState<string>("");

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...customColors];
    newColors[index] = value;
    setCustomColors(newColors);
    const gradient = buildGradient(newColors, angle);
    setSelectedGradient(gradient);
    onGradientChange?.(gradient);
  };

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = parseInt(e.target.value, 10);
    setAngle(newAngle);
    const gradient = buildGradient(customColors, newAngle);
    setSelectedGradient(gradient);
    onGradientChange?.(gradient);
  };

  const buildGradient = (colors: string[], angle: number): string => {
    const colorStops = colors.map((c, i) => `${c} ${((i / (colors.length - 1)) * 100).toFixed(0)}%`).join(", ");
    return `linear-gradient(${angle}deg, ${colorStops})`;
  };

  const applyPreset = (preset: typeof GRADIENT_PRESETS[number]) => {
    setCustomColors(preset.colors);
    setSelectedGradient(buildGradient(preset.colors, 90));
    onGradientChange?.(buildGradient(preset.colors, 90));
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Gradient Preview */}
      <div className="relative h-32 rounded-lg overflow-hidden shadow-inner"
           style={{
             background: selectedGradient || `linear-gradient(90deg, #667eea 0%, #764ba2 100%)`,
             backgroundSize: "400% 400%",
             animation: "gradient 8s ease infinite",
           }}>
        <style>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>

      {/* Preset Gradients */}
      <div className="grid grid-cols-3 gap-2">
        {GRADIENT_PRESETS.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => applyPreset(preset)}
            className="h-12 rounded border hover:shadow-lg transition-shadow"
            style={{
              background: buildGradient(preset.colors, 90),
              backgroundSize: "200% 200%",
              animation: "gradient 3s ease infinite",
            }}
            title={preset.name}
          />
        ))}
      </div>

      {/* Custom Colors */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Custom Colors</label>
        <div className="flex gap-2">
          {customColors.map((color, index) => (
            <div key={index} className="relative w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Angle Control */}
      <div className="flex flex-col gap-1">
        <Slider
          label="Angle"
          min={0}
          max={360}
          step={1}
          suffix="°"
          value={angle}
          onChange={(e) => {
            setAngle(Number(e));
            const gradient = buildGradient(customColors, Number(e));
            setSelectedGradient(gradient);
            onGradientChange?.(gradient);
          }}
        />
      </div>

      {/* Copy Gradient */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selectedGradient}
          readOnly
          className="flex-1 px-3 py-2 text-sm font-mono bg-gray-50 border rounded"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(selectedGradient);
            alert("Gradient copied to clipboard!");
          }}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
