'use client';

import * as React from 'react';
import { cn } from '../../utils';
import Slider from '../Slider/Slider';

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const GRADIENT_PRESETS = [
  { name: 'Purple Sunset', colors: ['#a8edea', '#fed6e3'] },
  { name: 'Ocean Blue', colors: ['#2980b9', '#6dd5fa', '#ffffff'] },
  { name: 'Sunset Orange', colors: ['#fa709a', '#fee140'] },
  { name: 'Matrix Green', colors: ['#11998e', '#38ef7d'] },
  { name: 'Dark Purple', colors: ['#30cfd0', '#330867'] },
  { name: 'Pink Dream', colors: ['#a18cd1', '#fbc2eb'] },
  { name: 'Teal Blue', colors: ['#84fab0', '#8fd3f4'] },
  { name: 'Golden Hour', colors: ['#f093fb', '#f5576c'] },
  { name: 'Midnight', colors: ['#232526', '#414345'] },
  {
    name: 'Rainbow',
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
  },
  {
    name: 'Pastel',
    colors: ['#f4e1e2', '#f5e6e3', '#eef3e5', '#d3e0e0', '#e4d3f4'],
  },
] as const;

const DEFAULT_COLORS = ['#667eea', '#764ba2'];
const DEFAULT_ANGLE = 90;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildGradient(colors: string[], angle: number): string {
  if (colors.length === 0) return '';
  if (colors.length === 1) {
    return `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[0]} 100%)`;
  }
  const stops = colors
    .map((c, i) => `${c} ${((i / (colors.length - 1)) * 100).toFixed(0)}%`)
    .join(', ');
  return `linear-gradient(${angle}deg, ${stops})`;
}

/** Extract the single number from Slider's `number | number[]` change value. */
function pickNumber(v: number | number[]): number {
  return Array.isArray(v) ? (v[0] ?? DEFAULT_ANGLE) : v;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GradientMakerProps {
  label?: string;
  onGradientChange?: (gradient: string) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const GradientMaker = React.forwardRef<HTMLDivElement, GradientMakerProps>(
  ({ label = 'Gradient', onGradientChange, className }, forwardedRef) => {
    const [customColors, setCustomColors] = React.useState<string[]>(DEFAULT_COLORS);
    const [angle, setAngle] = React.useState(DEFAULT_ANGLE);
    const [selectedGradient, setSelectedGradient] = React.useState<string>(() =>
      buildGradient(DEFAULT_COLORS, DEFAULT_ANGLE),
    );
    const [copied, setCopied] = React.useState(false);

    const labelId = React.useId();
    const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      };
    }, []);

    const emit = React.useCallback(
      (colors: string[], nextAngle: number) => {
        const gradient = buildGradient(colors, nextAngle);
        setSelectedGradient(gradient);
        onGradientChange?.(gradient);
      },
      [onGradientChange],
    );

    const handleColorChange = (index: number, value: string) => {
      const next = customColors.slice();
      next[index] = value;
      setCustomColors(next);
      emit(next, angle);
    };

    const handleAngleChange = (value: number | number[]) => {
      const next = pickNumber(value);
      setAngle(next);
      emit(customColors, next);
    };

    const applyPreset = (preset: (typeof GRADIENT_PRESETS)[number]) => {
      const colors = [...preset.colors];
      setCustomColors(colors);
      setAngle(DEFAULT_ANGLE);
      emit(colors, DEFAULT_ANGLE);
    };

    const handleCopy = async () => {
      if (!selectedGradient) return;
      try {
        await navigator.clipboard.writeText(selectedGradient);
        setCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
      } catch {
        // Silently ignore clipboard failures (e.g. missing permissions).
      }
    };

    return (
      <div
        ref={forwardedRef}
        className={cn('flex flex-col gap-4 rounded-lg bg-white p-4 shadow-md', className)}
      >
        {/* Single keyframe definition for the whole component tree */}
        <style>{`
          @keyframes a2z-gradient-pan {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>

        {label && (
          <span id={labelId} className="text-sm font-medium text-gray-700">
            {label}
          </span>
        )}

        {/* ---------- Preview ---------- */}
        <div
          aria-label="Gradient preview"
          className="relative h-32 overflow-hidden rounded-lg shadow-inner"
          style={{
            background: selectedGradient || buildGradient(DEFAULT_COLORS, DEFAULT_ANGLE),
            backgroundSize: '400% 400%',
            animation: 'a2z-gradient-pan 8s ease infinite',
          }}
        />

        {/* ---------- Presets ---------- */}
        <div role="group" aria-label="Gradient presets" className="grid grid-cols-3 gap-2">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-label={`Apply ${preset.name} preset`}
              title={preset.name}
              className={cn(
                'h-12 rounded border border-gray-200 transition-shadow hover:shadow-lg',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              )}
              style={{
                background: buildGradient([...preset.colors], DEFAULT_ANGLE),
                backgroundSize: '200% 200%',
                animation: 'a2z-gradient-pan 3s ease infinite',
              }}
            />
          ))}
        </div>

        {/* ---------- Custom colors ---------- */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Custom Colors</span>
          <div className="flex flex-wrap gap-2">
            {customColors.map((color, index) => (
              <label
                key={index}
                className={cn(
                  'relative h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-gray-300',
                  'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
                )}
                aria-label={`Color ${index + 1}`}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* ---------- Angle control ---------- */}
        <Slider
          label="Angle"
          min={0}
          max={360}
          step={1}
          suffix="°"
          value={angle}
          onChange={handleAngleChange}
          aria-label={`${label} angle`}
        />

        {/* ---------- Copy ---------- */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={selectedGradient}
            readOnly
            aria-label="Gradient CSS"
            className={cn(
              'flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            )}
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!selectedGradient}
            className={cn(
              'rounded px-4 py-2 text-sm text-white transition-colors',
              'bg-blue-600 hover:bg-blue-700',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    );
  },
);

GradientMaker.displayName = 'GradientMaker';

export default GradientMaker;
