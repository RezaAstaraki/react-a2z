'use client';

import * as React from 'react';
import { cn, copyToClipboard } from '../../utils';
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

export interface GradientMakerClassNames {
  root?: string;
  label?: string;
  preview?: string;
  presets?: string;
  preset?: string;
  customColors?: string;
  swatch?: string;
  angle?: string;
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
  customColors?: React.CSSProperties;
  swatch?: React.CSSProperties;
  angle?: React.CSSProperties;
  copyRow?: React.CSSProperties;
  copyInput?: React.CSSProperties;
  copyButton?: React.CSSProperties;
}

export interface GradientMakerProps {
  label?: string;
  onGradientChange?: (gradient: string) => void;
  className?: string;
  classNames?: GradientMakerClassNames;
  styles?: GradientMakerStyles;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const GradientMaker = React.forwardRef<HTMLDivElement, GradientMakerProps>(
  ({ label = 'Gradient', onGradientChange, className, classNames, styles }, forwardedRef) => {
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
        await copyToClipboard(selectedGradient);
        setCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
      } catch {
        // copyToClipboard already falls back to a textarea on non-secure
        // origins; this only swallows a genuine failure (e.g. denied).
      }
    };

    return (
      <div
        ref={forwardedRef}
        className={cn('flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-md', className, classNames?.root)}
        style={styles?.root}
      >
        {label && (
          <span
            id={labelId}
            className={cn('text-sm font-medium text-fg', classNames?.label)}
            style={styles?.label}
          >
            {label}
          </span>
        )}

        {/* ---------- Preview ---------- */}
        <div
          aria-label="Gradient preview"
          className={cn('relative h-32 overflow-hidden rounded-lg shadow-inner', classNames?.preview)}
          style={{
            background: selectedGradient || buildGradient(DEFAULT_COLORS, DEFAULT_ANGLE),
            ...styles?.preview,
          }}
        />

        {/* ---------- Presets ---------- */}
        <div
          role="group"
          aria-label="Gradient presets"
          className={cn('grid grid-cols-3 gap-2', classNames?.presets)}
          style={styles?.presets}
        >
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-label={`Apply ${preset.name} preset`}
              title={preset.name}
              className={cn(
                'h-12 rounded border border-border transition-shadow hover:shadow-lg',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                classNames?.preset,
              )}
              style={{
                background: buildGradient([...preset.colors], DEFAULT_ANGLE),
                ...styles?.preset,
              }}
            />
          ))}
        </div>

        {/* ---------- Custom colors ---------- */}
        <div className={cn('flex flex-col gap-2', classNames?.customColors)} style={styles?.customColors}>
          <span className="text-sm font-medium text-fg">Custom Colors</span>
          <div className="flex flex-wrap gap-2">
            {customColors.map((color, index) => (
              <label
                key={index}
                className={cn(
                  'relative h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-border-strong',
                  'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                  classNames?.swatch,
                )}
                style={styles?.swatch}
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
          classNames={{ root: classNames?.angle }}
          styles={{ root: styles?.angle }}
        />

        {/* ---------- Copy ---------- */}
        <div className={cn('flex items-center gap-2', classNames?.copyRow)} style={styles?.copyRow}>
          <input
            type="text"
            value={selectedGradient}
            readOnly
            aria-label="Gradient CSS"
            className={cn(
              'flex-1 rounded-md border border-border-strong bg-surface-sunken px-3 py-2 font-mono text-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              classNames?.copyInput,
            )}
            style={styles?.copyInput}
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!selectedGradient}
            className={cn(
              'rounded-md px-4 py-2 text-sm text-primary-fg transition-colors',
              'bg-primary-600 hover:bg-primary-700',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              classNames?.copyButton,
            )}
            style={styles?.copyButton}
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
