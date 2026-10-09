# react-a2z

React component library with Tailwind CSS styling, TypeScript support, and Next.js App Router compatibility.

## Install

```bash
npm install react-a2z
```

Peer dependencies: `react` and `react-dom` (>=18), `tailwindcss` (>=3.4 or v4),
and `zustand` (>=5, required by `Modal` and `Toast`).

## Tailwind v4 setup (recommended)

Components use Tailwind utility classes. In your app `globals.css`:

```css
@import "tailwindcss";
@source "./src/**/*.{js,ts,jsx,tsx}";
@import "react-a2z/tailwind.css";
```

`react-a2z/tailwind.css` scans `./dist` for library class names. Paths resolve from `node_modules/react-a2z/`, so this works with npm install and `npm link`.

PostCSS (Next.js example):

```js
// postcss.config.mjs
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

## Tailwind v3 setup (legacy)

```js
import reactA2zPreset, { contentPaths } from "react-a2z/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [reactA2zPreset],
  content: ["./src/**/*.{js,ts,jsx,tsx}", ...contentPaths],
};
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Usage

```tsx
"use client";

import { Button, Input } from "react-a2z";

export default function Page() {
  return (
    <>
      {/* variant is the shape, color is the hue — they are independent */}
      <Button variant="solid" color="primary" text="Click me" />
      <Input label="Email" placeholder="you@example.com" />
    </>
  );
}
```

Components that need interactivity (`Slider`, `Tooltip`, `ColorPicker`, `Counter`, `MdEditor`, `Modal`, `Toast`) already include `"use client"`, so they work in the App Router without extra wrappers. Presentational components (`Button`, `Input`, `PearlButton`, `Md`) are deliberately hook-free and stay Server Components, so importing them adds nothing to the client bundle — add `"use client"` at your own call site only when you pass them event handlers.

## Components

| Component | Notes |
|-----------|-------|
| `Button` | `variant` (shape) x `color` (hue) x `size`, plus icons, loading, `classNames`/`styles` |
| `Input` | label, helper text, validation, `startIcon`/`endIcon`, currency affix, slot overrides |
| `Slider` | headless compound (`Slider.Track`, `.Thumb`, ...), range, vertical, render props |
| `Tooltip` | shorthand or compound API, portal, auto-flip, controlled or uncontrolled |
| `ColorPicker` | native picker + preset swatches; slot overrides |
| `GradientMaker` | presets, custom stops, angle, optional copy row (`showCopy={false}`) |
| `Counter` | increment/decrement, in-view and place variants |
| `Modal` | `CustomModal` + `GlobalModal` (Zustand), logical 3x3 placement grid |
| `Toast` | `GlobalToast` + `ToastItem` (Zustand) |
| `Md` | markdown renderer with syntax highlighting |
| `MdEditor` | markdown editor with a toolbar and modes |
| `CodeBox` | read-only code block, reuses Md's highlighter |
| `PearlButton` | gloss hover + press; ships its own CSS |
| `ClientLogger` | client-side data logger for debugging |

Hooks and utilities are exported too — `useControllableState`, `useDebounce`,
`useInView`, `cn`, `createRecipe`, `copyToClipboard`, `normalizeHex` and more.

**Full API, house style and pitfalls** live in
[`LIBRARY-REFERENCE.md`](./LIBRARY-REFERENCE.md) in the repo.
An interactive guide with a live example per prop is in progress.

### Server vs client

`Button`, `Input`, `PearlButton` and `Md` are hook-free **Server Components** —
importing them adds nothing to the client bundle. `Slider`, `Tooltip`,
`ColorPicker`, `GradientMaker`, `Counter`, `MdEditor`, `Modal`, `Toast` and
`ClientLogger` carry `"use client"` and work in the App Router without extra
wrappers.

## Theming

Every colour, radius, shadow and font is a CSS custom property, so you can
re-theme the library from your own stylesheet, with no rebuild and no JS config.

```css
:root {
  --a2z-primary-600: 124 58 237;   /* "R G B" channels, not hex */
  --a2z-radius: 0.25rem;           /* every other radius derives from this */
}
```

Scope the override to a data attribute, a class, or a single component.
The -soft washes are baked rgba() values, so they need overriding
separately if you change the base hue:

```css
:root {
  --a2z-primary-soft: rgb(124 58 237 / 0.08);
  --a2z-primary-soft-hover: rgb(124 58 237 / 0.14);
}
```

Dark mode ships as .a2z-dark / .dark (class-based, not
prefers-color-scheme, so you control it). The full token list is in
tokens.css; the utility-name mapping is in tailwind.preset.js (v3) and
tailwind.css (v4).

For per-instance overrides, most components accept classNames and styles
keyed by slot (root, label, input, ...). Those merge last, so they
always beat the library defaults.
