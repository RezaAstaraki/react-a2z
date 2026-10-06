/**
 * react-a2z — Tailwind v3 preset.
 *
 * The token VALUES live in exactly one place: `styles/tokens.css`, as CSS custom
 * properties. This preset only maps Tailwind utility names onto those variables,
 * so the same token layer serves Tailwind v3 and v4 and a consumer can re-theme
 * by overriding CSS variables alone — no JS config edit, no rebuild.
 *
 * Channel form note: colors are declared as
 * `rgb(var(--a2z-x) / <alpha-value>)`. That placeholder is what makes opacity
 * modifiers (`bg-primary-600/50`) resolve, and it only composes with the
 * space-separated "R G B" triples stored in tokens.css.
 */

/** Builds one color scale plus its `-fg` (readable foreground) counterpart. */
const scale = (name) => {
  const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const out = {};
  for (const k of keys) out[k] = `rgb(var(--a2z-${name}-${k}) / <alpha-value>)`;
  out.fg = `rgb(var(--a2z-${name}-fg) / <alpha-value>)`;
  // Translucent washes are full rgba() values, so they need no placeholder.
  out.soft = `var(--a2z-${name}-soft)`;
  out['soft-hover'] = `var(--a2z-${name}-soft-hover)`;
  return out;
};

/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        primary: scale('primary'),
        neutral: scale('neutral'),
        success: scale('success'),
        warning: scale('warning'),
        danger: scale('danger'),
        info: scale('info'),

        // Flat semantic aliases (bg-bg, text-fg-muted, border-border, ...).
        bg: 'rgb(var(--a2z-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--a2z-surface) / <alpha-value>)',
          raised: 'rgb(var(--a2z-surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--a2z-surface-sunken) / <alpha-value>)',
        },
        overlay: 'rgb(var(--a2z-overlay) / <alpha-value>)',
        fg: {
          DEFAULT: 'rgb(var(--a2z-fg) / <alpha-value>)',
          muted: 'rgb(var(--a2z-fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--a2z-fg-subtle) / <alpha-value>)',
          inverted: 'rgb(var(--a2z-fg-inverted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--a2z-border) / <alpha-value>)',
          strong: 'rgb(var(--a2z-border-strong) / <alpha-value>)',
        },
        ring: 'rgb(var(--a2z-ring) / <alpha-value>)',
        'ring-offset': 'rgb(var(--a2z-ring-offset) / <alpha-value>)',
        disabled: {
          DEFAULT: 'rgb(var(--a2z-disabled-bg) / <alpha-value>)',
          fg: 'rgb(var(--a2z-disabled-fg) / <alpha-value>)',
          border: 'rgb(var(--a2z-disabled-border) / <alpha-value>)',
        },
        'on-inverse-soft': 'var(--a2z-neutral-soft)',
        'on-inverse-soft-hover': 'var(--a2z-neutral-soft-hover)',
      },
      borderRadius: {
        sm: 'var(--a2z-radius-sm)',
        DEFAULT: 'var(--a2z-radius)',
        md: 'var(--a2z-radius-md)',
        lg: 'var(--a2z-radius-lg)',
        xl: 'var(--a2z-radius-xl)',
      },
      boxShadow: {
        xs: 'var(--a2z-shadow-xs)',
        sm: 'var(--a2z-shadow-sm)',
        DEFAULT: 'var(--a2z-shadow-sm)',
        md: 'var(--a2z-shadow-md)',
        lg: 'var(--a2z-shadow-lg)',
        xl: 'var(--a2z-shadow-xl)',
      },
      fontFamily: {
        sans: 'var(--a2z-font-sans)',
        mono: 'var(--a2z-font-mono)',
      },
      transitionDuration: {
        fast: 'var(--a2z-duration-fast)',
        DEFAULT: 'var(--a2z-duration)',
        slow: 'var(--a2z-duration-slow)',
      },
      transitionTimingFunction: {
        a2z: 'var(--a2z-ease)',
      },
      ringWidth: { a2z: 'var(--a2z-ring-width)' },
      ringOffsetWidth: { a2z: 'var(--a2z-ring-offset-width)' },
    },
  },
  plugins: [],
};

/** Tailwind v3 — add to `content` in tailwind.config.js */
export const contentPaths = ["./node_modules/react-a2z/dist/**/*.{js,mjs,cjs}"];

/** Tailwind v3 — these carry the actual token VALUES. Import once, app-wide. */
export const tokenStylesheets = ["react-a2z/tokens.css", "react-a2z/components.css"];

/** Tailwind v4 — use `@import "react-a2z/tailwind.css"` in globals.css (recommended) */
export const tailwindV4Stylesheet = "react-a2z/tailwind.css";

export default preset;
