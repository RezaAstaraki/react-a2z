/* ------------------------------------------------------------------ */
/*  Colour primitives                                                  */
/* ------------------------------------------------------------------ */

/**
 * Shared colour helpers for `ColorPicker` and `GradientMaker`.
 *
 * Scope note: these exist because both components were doing ad-hoc string
 * comparison and none at all, respectively. This is deliberately NOT a general
 * colour library — it covers hex parsing, formatting and alpha, which is what
 * the two components need. Add to it when a third component needs more.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Normalises a hex string to lowercase `#rrggbb`.
 *
 * Accepts `#abc` (expands to `#aabbcc`), `#aabbcc`, and either with surrounding
 * whitespace or missing the leading `#`. Returns `null` for anything that is
 * not a valid 3- or 6-digit hex, so callers can distinguish invalid from black.
 */
export function normalizeHex(input: string): string | null {
  if (typeof input !== 'string') return null;
  let hex = input.trim().toLowerCase();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (!/^[0-9a-f]+$/.test(hex)) return null;
  if (hex.length === 3) {
    hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
  }
  if (hex.length !== 6) return null;
  return '#' + hex;
}

/** True when `input` parses to a hex colour. */
export function isValidHex(input: string): boolean {
  return normalizeHex(input) !== null;
}

/** `#rrggbb` -> `{ r, g, b }` with 0-255 channels. `null` for invalid input. */
export function hexToRgb(input: string): Rgb | null {
  const hex = normalizeHex(input);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** `{ r, g, b }` -> `#rrggbb`. Channels are clamped and rounded. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const part = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return '#' + part(r) + part(g) + part(b);
}

/**
 * Applies an alpha channel, returning `rgba(...)`.
 *
 * Returns `rgba(0, 0, 0, 0)` for invalid input rather than throwing — a colour
 * component rendering a transparent swatch is a better failure than a crash.
 */
export function withAlpha(input: string, alpha: number): string {
  const rgb = hexToRgb(input);
  if (!rgb) return 'rgba(0, 0, 0, 0)';
  const a = Math.max(0, Math.min(1, alpha));
  return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + a + ')';
}

/**
 * HSL -> hex. `h` is degrees (wrapped), `s` and `l` are 0-1.
 *
 * Used for gradient work, where rotating hue is more natural than
 * interpolating RGB channels directly.
 */
export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const lum = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lum - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

/**
 * Relative luminance (WCAG), 0-1. Used to pick a readable foreground for a
 * given swatch — white on dark colours, black on light ones.
 */
export function luminance(input: string): number {
  const rgb = hexToRgb(input);
  if (!rgb) return 0;
  const channel = (n: number) => {
    const v = n / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Picks `#ffffff` or `#000000` for maximum contrast against `background`. */
export function readableForeground(background: string): string {
  return luminance(background) > 0.179 ? '#000000' : '#ffffff';
}
