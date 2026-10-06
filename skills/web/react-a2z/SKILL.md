---
name: react-a2z
description: React + TypeScript component library with Tailwind CSS, Rollup bundling, headless compound components, and Next.js App Router support.
version: 2.0.0
author: Reza Astaraki
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [react, components, tailwind, library, headless, rollup]
    related_skills: [dogfood]
---

# react-a2z

React component library with Tailwind CSS, TypeScript, and Rollup. Ships reusable
UI components, hooks, and utilities for React / Next.js apps.

## Session Protocol (how to work with this user in this repo)

**Environment:**
- Windows host + WSL. Repo path in WSL: `/mnt/c/Users/reza/tavana/github/react-a2z`.
- Editor (VS Code) may write CRLF. Repo has `.gitattributes` with `* text=auto` —
  blobs are LF, worktree may be CRLF. Do **not** try to normalize the worktree.
- Push uses a classic PAT (`repo` scope) over HTTPS.

**Interaction model:**
- The user runs every shell command himself. Give **ONE command block at a time**,
  he pastes the output, THEN you proceed. Never batch probes.
- Lead with the exact copy-paste block. No prose first.
- When giving code: name the file, and offer a verification command in the same
  message (`wc -l`, `cat`, `grep -c`).

**Shell gotchas (all have burned us):**

| Trap | Fix |
|------|-----|
| `sed -i '/foo$/a bar'` silently no-ops | Worktree may be CRLF; `---
name: react-a2z
description: React + TypeScript component library with Tailwind CSS, Rollup bundling, headless compound components, and Next.js App Router support.
version: 2.0.0
author: Reza Astaraki
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [react, components, tailwind, library, headless, rollup]
    related_skills: [dogfood]
---

# react-a2z

React component library with Tailwind CSS, TypeScript, and Rollup. Ships reusable
UI components, hooks, and utilities for React / Next.js apps.

 anchors fail. Prefer `cat > file <<'EOF'` rewrites or a `node` script written to `/tmp/*.js`. |
| `node -e '…'` when the JS contains `'` | Write the script to `/tmp/x.js` via heredoc, then `node /tmp/x.js`. |
| Bare `!` in bash | History expansion. Put it in a script file, or use `[ -f x ]` tests. |
| `find` / `git diff` opens pager | Use `git --no-pager <cmd>` or pipe to `cat`. |
| Bulk `git status` noise after editor writes | Almost always CRLF churn — verify with `git diff --ignore-cr-at-eol --name-only`. |

**Skill file location:**
- This file: `skills/web/react-a2z/SKILL.md` (in repo, committed).
- Unrelated 33-line stub at `~/.hermes/skills/software-development/react-a2z-component-library/SKILL.md` — ignore it, don't confuse them.

**Commit hygiene:**
- Identity: `RezaAstaraki <reza.astaraky@gmail.com>`.
- Stage only intended files (`git add <file>`), never `git add .`.

## Overview

- **Stack:** React 18+, TypeScript 5+, Tailwind CSS 3.4+ / v4, Rollup.
- **Interop:** Every interactive component ships with `"use client"` (preserved
  through Rollup by `preserveDirectives()` in `rollup.config.js`).
- **Bundling:** `preserveModules: true` → per-file ESM + CJS output.
- **Peers:** `react`, `react-dom`, `tailwindcss`, `zustand`.
- **Runtime deps:** only `clsx`, `tailwind-merge`, `classNames` (via `cn`).

## House Style (non-negotiable — every component follows this)

1. `import * as React from 'react'` — never named-import from React.
2. `React.forwardRef<HTMLElement, Props>` for any component that renders a DOM node.
3. Set `Component.displayName = 'Component'`.
4. `"use client"` at the top of every interactive component file.
5. Class merging uses `cn` from `../../utils` — **never** `.filter(Boolean).join(' ')`.
   `cn` = `twMerge(clsx(...))` so the last conflicting Tailwind class wins.
6. **Baked-in default classes** matching the house palette
   (`blue-600` primary, `gray-*` neutrals, `focus-visible:ring-2 ring-blue-500 ring-offset-2`).
   Components look right out of the box, override via `className` / `classNames` / `styles`.
7. `className`, `classNames`, `style`, `styles` slots — consumers always win.
8. **Controlled + uncontrolled** via the shared `useControllableState` pattern.
9. **`useId()`** for auto-wiring `<label htmlFor>` ↔ `<input id>` ↔ `aria-labelledby`.
10. **Accessibility defaults:** keyboard handlers, `aria-*`, `focus-visible:ring-2`,
    `disabled:cursor-not-allowed disabled:opacity-50`.
11. **Type exports use `export type { … }`.** Never mix value + type imports in
    one statement. This is the #1 source of build errors here.
12. Prefer `ref={mergeRefs(forwardedRef, localRef)}` when a component needs its
    own DOM ref internally (Slider does this).

## Barrel / Re-export Rules

Chain of exports must stay clean:

```
src/index.ts                → export * from "./components" | "./hooks" | "./utils"
src/components/index.ts     → per-component value + type exports (see below)
src/components/X/index.ts   → default + named value, then type-only exports
```

**Correct pattern for a sub-barrel:**

```ts
import Slider from './Slider';
export type { SliderProps, SliderClassNames } from './Slider';
export { Slider };
export default Slider;
```

**Never** do `import X, { XProps } from "./X"` — split into a value import and
a separate `export type { … }`.

## Components

### Button

Variants: `filled-blue`, `outlined-blue`, `text-blue`, `filled-gray`,
`outlined-white`, `text-white`. Sizes: `xs | sm | md | lg`.
Props: `variant`, `size`, `buttonType` (`text | icon-only`), `icon`,
`iconPosition` (`left | right | center`), `loading`, `text`.

### Input

Form input with `label` + `placeholder`. Uses `useId` for label linkage.

### Slider (headless compound component)

- **Compound:** `Slider`, `Slider.Label`, `Slider.Track`, `Slider.Fill`,
  `Slider.Thumb`, `Slider.Output`.
- **Controlled + uncontrolled:** `value` / `defaultValue` / `onChange` / `onChangeEnd`.
- **Range:** pass `number[]` for `value` / `defaultValue` — renders multiple thumbs.
- **Orientation:** `horizontal` (default) or `vertical`.
- **Accessibility:** `role="slider"`, `aria-valuemin/max/now`, `aria-orientation`,
  arrow / PageUp / PageDown / Home / End keys, `useId` links `<Slider.Label>`.
- **Styling:** baked-in Tailwind defaults for both orientations. Override with:
  - `classNames={{ root, label, track, fill, thumb, output }}`
  - `styles={{ root, label, track, fill, thumb, output }}`
  - `className` on any compound child
- **Render props:** on the root (`renderThumb`, `renderTrack`, `renderFill`,
  `renderOutput`, `renderLabel`) **and** as `render` on each compound child.
- **Value formatting:** `label`, `suffix`, `formatValue`, `showOutput`.
- **Pointer handling:** `setPointerCapture` + `pointerup`/`pointercancel` cleanup.
- **Range safety:** thumbs can't cross — each is clamped between neighbors.
- **Step safety:** `snapToStep` guards `step <= 0`.

Example:

```tsx
<Slider
  label="Angle"
  min={0}
  max={360}
  step={1}
  suffix="°"
  value={angle}
  onChange={(v) => setAngle(Array.isArray(v) ? v[0]! : v)}
/>

// Range, vertical, custom styling
<Slider
  orientation="vertical"
  defaultValue={[20, 80]}
  classNames={{ fill: "bg-gradient-to-t from-orange-400 to-red-600" }}
/>
```

### Tooltip
- **Two APIs:** shorthand (`content={…}` auto-wraps children in `Tooltip.Trigger` + `Tooltip.Content`) OR compound (`Tooltip.Trigger` + `Tooltip.Content`).
- **Controlled + uncontrolled:** `open` / `defaultOpen` / `onOpenChange`.
- **Props:** `placement` (`top|right|bottom|left`), `offset` (px), `delayDuration`,
  `closeDelay`, `disabled`, `showArrow`, `container` (portal target, default `document.body`).
- **Positioning:** `createPortal` + `position: fixed`, auto-flips when the preferred
  side overflows, clamps to viewport. Recomputes on scroll/resize.
- **Accessibility:** `role="tooltip"`, `useId` wires trigger `aria-describedby`,
  Escape closes while open, focus opens immediately / blur closes.
- **Styling:** `className` / `classNames={{ root, trigger, content, arrow }}` /
  `style` / `styles`. Baked-in defaults (`bg-gray-900 text-white text-xs`, blue focus ring).
- **Render prop:** `render` on `Tooltip.Content` receives
  `{ ref, className, style, placement, side, open, contentId }`.
- Files: `src/components/Tooltip/Tooltip.tsx`, `src/components/Tooltip/index.ts`.

### ColorPicker

Controlled or uncontrolled. Props: `label`, `value`, `defaultValue`, `onChange`,
`presetColors`, `showPresets`, `showValue`, `disabled`, `className`. Uses
`useId` + `aria-pressed` on preset buttons; input forwards ref.

### GradientMaker

Props: `label`, `onGradientChange`, `className`. Composes 11 gradient presets,
custom color pickers, and the Slider for angle. Keyframes hoisted to
`a2z-gradient-pan` to avoid consumer collisions. Copy button uses inline
"Copied!" state — **no `alert()`**.

### Md / MdEditor

Markdown renderer (with syntax highlighting) and editor. Editor exposes
`MdEditorHandle`, `MdEditorMode`, `MdEditorToolId`.

### Modal

`CustomModal` + `GlobalModal` with Zustand store.

### Toast

`GlobalToast` + `ToastItem` with Zustand store.

### PearlButton

Gloss hover + press. Ships `styles/pearl-button.css` (prefix `a2z-pearl-btn`).
Optional import: `react-a2z/PearlButton/styles.css`.

### Counter

Increment/decrement with `CounterVariant`, `CounterPlace`, `CounterInView`.

### ClientLogger

Client-side logger (`Wrapper` component for debugging).

## Hooks (`src/hooks`)

- `useDebounce` — debounced value
- `useDebouncedCallback` — debounced function
- `useElementSize` — ResizeObserver
- `useInView` — IntersectionObserver
- `useThrottle` — throttled value
- `useWindowSize` — window resize

## Utilities (`src/utils`)

- `cn` — clsx + tailwind-merge (**use this everywhere for class merging**)
- `englishDigitsToPersian` / `persianToEnglishDigits`
- `formDataMaker`, `sanitizeNumericInput`, `truncateText`, `readFileAsDataUrl`

## Styling Model

- Components ship **Tailwind utility classes baked in** (not CSS files) except
  `PearlButton`, which has its own CSS because the effects can't be expressed
  cleanly with utilities.
- Consumers style by passing `className`, `classNames`, `style`, or `styles`.
  `cn()` guarantees consumer classes always win over defaults.
- `tailwind.preset.js` is currently **empty** — components only use stock
  Tailwind tokens. If you add brand tokens later, extend the preset and reuse
  them inside components.
- `tailwind.css` uses `@source "./dist"` so Tailwind v4 scans compiled output.

## Build

- `npm run rollup` — production build
- `npm run dev` — watch mode
- `rollup.config.js` — `preserveModules: true`, `preserveModulesRoot: 'src'`,
  `terser({ compress: { directives: false } })` so `"use client"` survives.
- Two outputs: `dist/cjs`, `dist/esm`, plus flattened `dist/index.d.ts`.
- `preserveDirectives()` plugin re-adds `"use client"` / `"use server"` to each
  chunk because Rollup strips them.

## package.json exports — subpath rules

Rollup flattens pure re-export modules — a file whose body is only
`export ... from ...` and has no code of its own — unless the file is an
explicit entry point. Under `preserveModules`, an interior barrel is therefore
not emitted as its own chunk: its exports are hoisted into the parent, and no
`X/index.js` is written. This is independent of `treeshake.moduleSideEffects`
and of `hoistTransitiveImports` (the latter is ignored under `preserveModules`).

**Correct shape (matches `./Button`, `./Input`, `./PearlButton`, `./Slider`, `./Tooltip`):**

```json
"./Tooltip": {
  "types":   "./dist/index.d.ts",
  "import":  "./dist/esm/components/Tooltip/Tooltip.js",
  "require": "./dist/cjs/components/Tooltip/Tooltip.js"
}
```

**Resolved (2026-10-05):** `./Modal`, `./Toast`, `./ColorPicker`, `./Md`,
`./MdEditor`, `./Counter`, and `./hooks` used to target a non-existent
`index.js`. Fixed by listing those barrels as explicit entry points in
`rollup.config.js` (the `entries` array). When you add a subpath export that
targets `X/index.js`, add `src/.../X/index.ts` to that array as well.

**Verification (run after every build):**

```bash
node -e "const p=require('./package.json'),fs=require('fs'); for (const [k,v] of Object.entries(p.exports)) { if (typeof v!=='object') continue; const ok=fs.existsSync(v.import); console.log(k.padEnd(16), ok?'OK':'MISSING', v.import); }"
```

## Consumer Setup

### Tailwind v4 (recommended)

```css
/* globals.css */
@import 'tailwindcss';
@source "./src/**/*.{js,ts,jsx,tsx}";
@import 'react-a2z/tailwind.css';
```

```js
// postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } };
```

### Tailwind v3

```js
import reactA2zPreset, { contentPaths } from 'react-a2z/tailwind';

export default {
  presets: [reactA2zPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}', ...contentPaths],
};
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Usage

```tsx
'use client';
import { Button, Input, Slider, ColorPicker, GradientMaker } from 'react-a2z';
```

## File Structure

```
react-a2z/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── ClientLogger/
│   │   ├── ColorPicker/          # ColorPicker + GradientMaker
│   │   ├── Counter/
│   │   ├── Input/
│   │   ├── Md/
│   │   ├── MdEditor/
│   │   ├── Modal/
│   │   ├── PearlButton/
│   │   ├── Slider/               # headless compound component
│   │   ├── Toast/
│   │   ├── Tooltip/              # portal, compound, two APIs
│   │   └── index.ts
│   ├── hooks/
│   ├── utils/                    # cn, digit converters, form helpers
│   └── index.ts
├── styles/
│   └── pearl-button.css
├── tailwind.config.js
├── tailwind.preset.js
├── tailwind.css
├── rollup.config.js
├── tsconfig.json
└── package.json
```

## Common Pitfalls (already hit, don't repeat)

| Pitfall                                            | Fix                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `import X, { XProps }` in one statement            | Split: value import + `export type`                                |
| `values[0]` under `noUncheckedIndexedAccess`       | `values[0] ?? min` or `Array.isArray(...) ? ... : [value]`         |
| Mixing value + type in one `export { … }`          | Use `export { X }` for values, `export type { X }` for types       |
| `key={index}` for dynamic lists                    | Use a stable identifier (name, id, color)                          |
| `alert()` in components                            | Inline state + timeout, cleanup on unmount                         |
| Inline `<style>` per render                        | Hoist keyframes once at the component root; prefix `a2z-`          |
| `renderThumb` on props but never forwarded         | Plumb into default children OR remove from the API                 |
| Range `Slider.Fill` computed from `values[0]` only | Compute `left` + `width` (or `bottom` + `height`) from both bounds |
| `step = 0` → `Infinity`                            | `snapToStep` guards `step <= 0`                                    |
| `forwardedRef ?? rootRef` — one silently wins      | Use `mergeRefs(forwardedRef, localRef)`                            |
| Clipboard copy without try/catch                   | Wrap in try/catch; UI feedback via state                           |
| Preset click didn't sync Slider angle              | Emit through a single `emit(colors, angle)` helper                 |
| `export *` from a barrel with default export       | Default exports don't propagate — export named values explicitly   |
| `package.json#exports` points at `dist/.../X/index.js` that Rollup never emits | List `src/.../X/index.ts` in `rollup.config.js` `entries`, OR point the subpath at the concrete `X/X.js` file. Making the barrel reachable from `src/index.ts` does NOT help |
| Barrel `X/index.ts` is a pure re-export and no `X/index.js` is emitted | List `src/.../X/index.ts` in the `entries` array in `rollup.config.js` — barrels are only emitted when they are explicit entry points |
| Window `pointermove`/`pointerup` listeners leak if the component unmounts mid-drag | Pre-existing in `Slider` thumb + track handlers. Move listener registration into a `useEffect` with cleanup that removes them. Not yet fixed |
| `sed -i '/…$/a …'` silently no-ops on CRLF files | Repo is CRLF; `$`-anchored patterns fail. Use `cat > file <<'EOF'` rewrites or `node -e` scripts, never blind `sed` |
| Leftover `useState` + `useEffect(() => setX(true), [])` "mounted" flag | Remove it — `noUnusedLocals` catches it; SSR-safe code shouldn't need the pattern unless you branch on it |
| Tooltip content silently missing on first render because `container` is `null` | `createPortal` needs a DOM node; return `null` from `Tooltip.Content` when `container` is falsy (SSR-safe) |

## Verification Checklist (for a new agent session)

Before making changes, run:

```bash
cat package.json
cat rollup.config.js
cat src/index.ts
cat src/components/index.ts
cat src/utils/cn.tsx
```

These five files define the public surface, build pipeline, and shared style
utility. Everything else follows from them.

After changes, run:

```bash
npm run rollup
```

Expected output:

- No `TS2322` / `TS2345` warnings from `src/components/**`.
- `dist/index.d.ts` contains all component + type names.
- No `RollupError: Failed to compile` from `rollup-plugin-dts`.

Then verify exports:

```bash
grep -E "Slider|ColorPicker|GradientMaker" dist/index.d.ts
```

Should show values and types for each.

Then verify every subpath export resolves to an emitted file:

```bash
node -e "const p=require('./package.json'),fs=require('fs'); for (const [k,v] of Object.entries(p.exports)) { if (typeof v!=='object') continue; if (!fs.existsSync(v.import)) console.log('MISSING', k, v.import); }"
```

No output = all subpaths resolve.

## When Extending the Library

If you add a new component:

1. Create `src/components/NewComponent/NewComponent.tsx` + `index.ts`.
2. Follow the House Style above (forwardRef, cn, useId, controlled/uncontrolled, disabled, className).
3. Bake in default Tailwind classes matching the palette (`blue-600`, `gray-*`).
4. Split value + type exports.
5. Add to `src/components/index.ts` with per-component value + type exports.
6. Add a `package.json#exports` subpath if it's a top-level entry.
7. If it needs CSS that can't be expressed as utilities, add `styles/new-component.css`
   and list it in `package.json#files` + a `./NewComponent/styles.css` export.
8. Run `npm run rollup` and verify the d.ts surface.

## Design Principles

- **Headless where it matters:** compound components + render props let consumers
  build any look without forking the library.
- **Opinionated defaults:** components look right without any props. Override,
  don't configure.
- **Zero runtime CSS:** everything is Tailwind utilities except PearlButton's CSS.
- **Accessible by default:** labels auto-linked, focus rings, keyboard handlers,
  proper ARIA roles.
- **No hidden globals:** no required CSS import for a component to look correct.
- **Composability over configuration:** expose `Slider.Track`, `Slider.Thumb`, etc.
  rather than a giant props matrix.
