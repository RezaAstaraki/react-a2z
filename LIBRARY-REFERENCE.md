# react-a2z

React component library with Tailwind CSS, TypeScript, and Rollup. Ships reusable
UI components, hooks, and utilities for React / Next.js apps.

## Working instructions

This document describes the API, tokens, exports, and build. Current source takes
precedence over historical notes. Codex project guidance is in
[AGENTS.override.md](./AGENTS.override.md), which identifies the approved design
and demo rules and excludes the legacy agent instructions.

## Overview

- **Stack:** React 18+, TypeScript 5+, Tailwind CSS 3.4+ / v4, Rollup.
- **Interop:** Server-safe by default. A component carries `"use client"` only
  when it genuinely needs hooks, state, browser APIs, or a portal (preserved
  through Rollup by `preserveDirectives()` in `rollup.config.js`). Never stamp
  it on a presentational component — that forces the component and its subtree
  into the client bundle. Tests assert directives for selected exports;
  review the intended boundary when adding or changing a component.
  Currently client: `Slider`, `Tooltip`, `ColorPicker`, `GradientMaker`,
  `Counter`, `MdEditor`, `ClientLogger`, `Modal`, `Toast`, `Checkbox`, `Switch`,
  `Select`, `MultiSelect`, `AutocompleteInput`, `Textarea`, `Tabs`, `Accordion`.
  Without a client directive: `Button`, `Input`, `PearlButton`, `Md`, `Badge`,
  `Card`, `Progress`, `Skeleton`. `CodeBox` has an internal client copy button.
  These components still enter the client bundle when imported from a client boundary.
- **Bundling:** `preserveModules: true` → per-file ESM + CJS output.
- **Peers:** `react`, `react-dom`, `tailwindcss`, `zustand`.
- **Runtime deps:** only `clsx` + `tailwind-merge`, merged by `cn`.

## House Style (non-negotiable — every component follows this)

1. `import * as React from 'react'` — never named-import from React.
2. `React.forwardRef<HTMLElement, Props>` for any component that renders a DOM node.
3. Set `Component.displayName = 'Component'`.
4. `"use client"` **only** when the component needs hooks, state, browser APIs,
   or a portal — never on presentational components. Keep dumb primitives
   (button/input-like) hook-free so they stay usable as Server Components.
5. Class merging uses `cn` from `../../utils` — **never** `.filter(Boolean).join(' ')`.
   `cn` = `twMerge(clsx(...))` and the last conflicting class wins. It is
   token-aware: the library's `-600` / `-soft` / `-fg` names merge against
   plain Tailwind colours, so a consumer's `bg-red-500` beats `bg-primary-600`.
6. **Baked-in classes come from design tokens** — never a raw Tailwind palette
   colour. Use `bg-primary-600`, `text-fg-muted`, `border-border`, `ring-ring`,
   `rounded-md`, `ease-a2z` (see **Design tokens**). Components look right out
   of the box and re-theme when a consumer overrides `--a2z-*` variables.
7. `className`, `classNames`, `style`, `styles` slots — consumers always win.
8. **Controlled + uncontrolled** via `useControllableState` from `../../hooks`
   — shipped, not a pattern to reimplement. Same for `mergeRefs` below.
9. **`useId()`** for auto-wiring `<label htmlFor>` ↔ `<input id>` ↔ `aria-labelledby`.
10. **Accessibility defaults:** keyboard handlers, `aria-*`, `focus-visible:ring-2`,
    `disabled:cursor-not-allowed disabled:opacity-50`.
11. **Type exports use `export type { … }`.** Never mix value + type imports in
    one statement. This is the #1 source of build errors here.
12. `ref={mergeRefs(forwardedRef, localRef)}` — `mergeRefs` from `../../utils`
    is shipped. Never write `forwardedRef ?? rootRef`; one silently wins.
13. **JSDoc lives on the prop, not the type alias.** Every prop in a public
    `XProps` carries its own `/** ... */`. Alias JSDoc (`ButtonVariant`,
    `ButtonColor`) stays — it is public API and shows when a consumer hovers
    the alias itself — but editors do **not** surface alias JSDoc on the
    prop's hover, so a prop documented only on its alias shows an empty
    tooltip. Both the generated prop table and VS Code read the prop-level doc.

## Design tokens

Every colour, radius, shadow and font is a CSS custom property in
`tokens.css` at the package root. That file is the single source of
values; the Tailwind names are mapped from it (v3 preset + v4 `@theme`).

- **Channels are "R G B" triples**, never hex. v3 needs
  `rgb(var(--a2z-primary-600) / <alpha-value>)` for opacity modifiers to work,
  and that only composes with a triple.
- **Aliases use `var()`**, resolved at computed-value time, so overriding
  `--a2z-primary-600` re-themes every alias derived from it.
- **The `-soft` washes are baked `rgba()`** values, not channel triples —
  they need overriding separately if you change the base hue.
- **`--a2z-radius` is the single radius knob**; all other radii are `calc()`
  from it, so `--a2z-radius: 0` yields a fully square UI.
- **Dark mode is class-based** (`.a2z-dark` / `.dark`), never
  `prefers-color-scheme`, so an app can force either mode.

**v3 vs v4 mapping.** v3 consumers get names from `tailwind.preset.js`.
v4 consumers get them from the `@theme inline` block in `tailwind.css`.
The block is `inline` deliberately: plain `@theme` would emit a second
`--color-primary-600` variable for utilities to reference, giving two names for
one knob. `inline` bakes the `var(--a2z-*)` reference straight into the
utility, so `--a2z-*` stays the only override path.

This is why the README can promise no-rebuild re-theming: a consumer
overrides a variable and every utility that references it updates.

**Current validation:** `npm test` builds the library and checks exports,
client directives, selected rendered component contracts, and slot override
priority. `npm run cli:test` checks CLI-generated styling with real Tailwind v3
and v4. See [RELEASING.md](./RELEASING.md) for packed-artifact compatibility checks;
these checks do not replace browser interaction and computed-style review.

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

`variant` is the SHAPE, `color` is the HUE — they are independent, so
5 x 6 = 30 combinations without a variant per pair.
- `variant`: `solid | soft | outline | ghost | link` (default `solid`)
- `color`: `primary | neutral | success | warning | danger | info` (default `primary`)
- `size`: `xs | sm | md | lg`
- `shape`: `text | icon-only` (`buttonType` is the deprecated alias)
- `icon` / `iconPosition` (`left | right | both`), `loading`, `loadingIcon`,
  `fullWidth`, `text`, `children`
- `classNames` / `styles`: slots `root | text | icon | spinner`
- `loading` sets `aria-busy` and applies the DISABLED styles, so `color`
  has no visible effect while loading (`<Button loading color="success">`
  renders grey). Open 2.0.0 question: see ROADMAP.md §5.

### Input

Form input with `label` + `placeholder`. Uses `useId` for label linkage.
- `size`: `sm | md | lg`. States come from real props: `required`,
  `disabled`, native `readOnly`, `isInvalid`, `error`, `helperText`.
  There is no `variant` prop — an earlier design had one and it is gone.
- `startIcon` / `endIcon` / `currency` (start slot, inline-start edge)
- `classNames` / `styles`: slots `root | label | wrapper | input |
  startIcon | endIcon | helper | helperText`
- Deprecated, still accepted for one major: `inputClassName` ->
  `classNames.input`, `labelClassName` -> `classNames.label`,
  `readonly` -> `readOnly`, `errorMessage` -> `error`

### Additional form controls

- **Checkbox:** native `checked` / `defaultChecked`, `onCheckedChange`,
  `indeterminate`, `label`, `description`, `error`, and `classNames`.
- **Switch:** native `checked` / `defaultChecked`, `onCheckedChange`, `label`,
  `description`, and `classNames` including `track` and `thumb`.
- **Textarea:** native textarea attributes, `label`, `description`, `error`,
  `size`, `resize`, `onValueChange`, and shared `FieldClassNames`.
- **Select:** `options` contain `{ value, label, disabled?, description? }`.
  Supports native `value` / `defaultValue`, `onValueChange`, field props,
  `classNames`, `open` / `defaultOpen` / `onOpenChange`, `indicator`,
  `renderValue`, and `renderOption`. Styled mode portals its menu and retains a
  native select for forms/ref access. `native`, `multiple`, or native children
  select the native picker; styled-menu options do not control that picker.
- **MultiSelect:** `options`, `value` / `defaultValue` as string arrays,
  `onValueChange`, `maxSelected`, `clearable`, `onQueryChange`, and shared
  `ComboboxClassNames` for options, chips, buttons, and field elements.
- **AutocompleteInput:** `options`, string `value` / `defaultValue`,
  `onValueChange`, `onOptionSelect`, `minQueryLength`, `clearable`, and
  `ComboboxClassNames`. Free text is allowed; selecting a suggestion inserts
  its label, while `onOptionSelect` receives its identifier and full option.

All these components forward refs to their native controls. The separate
[CLI](./packages/react-a2z-cli/README.md) currently offers editable copies of
Select and its shared field utilities, plus ColorPicker and GradientMaker with
their color, HEX-editor, state, and clipboard helpers. Other components remain
library exports. See the CLI guide for local versus published commands.

### Tabs and Accordion

- **Tabs:** required `items` (`value`, `label`, `content`, optional `disabled`)
  and accessible `label`; `value` / `defaultValue` / `onValueChange`,
  `orientation`, `activationMode`, `animated`, and `TabsClassNames`.
  Automatic activation selects on arrow keys; manual activation requires
  Enter or Space. Disabled tabs are skipped.
- **Accordion:** required `items` (`value`, `title`, `content`, optional
  `disabled`); array `value` / `defaultValue` / `onValueChange`, `multiple`,
  `animated`, and `AccordionClassNames`. Single mode uses only the first open
  value. Both components respect reduced-motion preferences.

### Badge, Card, Progress, and Skeleton

- **Badge:** semantic `color`, `variant` (`soft | solid | outline`),
  `size` (`sm | md`), decorative `dot`, and `BadgeClassNames`.
- **Card:** `variant` (`bordered | elevated | flat`) and `classNames.root`.
  `CardHeader`, `CardBody`, and `CardFooter` are separately exported sections,
  each accepting native div attributes and its own `classNames.root`.
- **Progress:** required accessible `label`, optional `value` (omit for
  indeterminate), `max`, `showLabel`, `color`, `size`, and `ProgressClassNames`.
  Finite values are clamped to bounds; invalid bounds fall back to 100.
- **Skeleton:** `variant` (`text | rounded | circle`), `animated`, and
  `classNames.root`. Decorative (`aria-hidden`); reduced motion disables pulse.

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
- **Render-prop `className` is pre-merged.** The `className` handed to
  `renderThumb` (and the other render props) has already been through `cn()`,
  so it contains the default classes (`bg-surface`, `border-primary-600`, ...).
  Appending a raw `" bg-emerald-500"` does NOT override them -- both sit on
  the element and stylesheet order decides. Use inline `style`, or re-merge
  through `cn(props.className, "bg-emerald-500")`. The `classNames` prop is
  NOT affected: it is merged inside the component.
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
- **The trigger owns the interaction.** `Tooltip.Trigger` renders a `<span>` and wires
  `pointerenter` (open after `delayDuration`), `pointerleave` (close after `closeDelay`),
  `pointermove` (cancels a pending *close* only), `focus` (open immediately) and `blur`
  (close) itself — never attach your own; handlers you pass are composed with the
  built-in ones. Because that span is not focusable, **what you wrap must be the focusable
  element** (`<button>`, `<a>`, `<input>`). Wrapping plain text or a bare `<span>` makes the
  tooltip mouse-only. There is no `asChild`, so you cannot render the trigger *as* your element.
- **Controlled + uncontrolled:** `open` / `defaultOpen` / `onOpenChange`.
- **Props:** `placement` (`top|right|bottom|left`), `offset` (px), `delayDuration`,
  `closeDelay`, `disabled`, `showArrow`, `container` (portal target, default `document.body`).
- **Positioning:** `createPortal` + `position: fixed`, auto-flips when the preferred
  side overflows, clamps to viewport. Recomputes on scroll/resize.
- **SSR / hydration:** `open` or `defaultOpen` true on the FIRST render breaks
  hydration -- React does not render portals on the server, so the server HTML
  has no tooltip node while the client's does. Gate the first render on a
  `mounted` flag (false on server and on the first client render, true in an
  effect), or start closed. The internal `container === null` guard covers the
  no-DOM case; it cannot cover a consumer forcing `open`.
- **`container` and CSS transforms:** a `transform`, `filter` or `perspective`
  on an ancestor makes it the containing block for `position: fixed`
  descendants. Portaling into such a subtree sends the tooltip to the wrong
  place; the default `document.body` target is unaffected.
- **Accessibility:** `role="tooltip"`, `useId` wires trigger `aria-describedby`,
  Escape closes while open, focus opens immediately / blur closes.
- **Styling:** `className` / `classNames={{ root, trigger, content, arrow }}` /
  `style` / `styles`. Baked-in defaults (`bg-gray-900 text-white text-xs`, blue focus ring).
- **Root is `display: contents`.** `className` and `style` land on a span that
  generates no box, so only inheriting properties (`color`, `font-*`) visibly
  reach the trigger. For anything else use `classNames.trigger` /
  `classNames.content`.
- **Render prop:** `render` on `Tooltip.Content` receives
  `{ ref, className, style, placement, side, open, contentId }`.
- Files: `src/components/Tooltip/Tooltip.tsx`, `src/components/Tooltip/index.ts`.

### ColorPicker

Controlled (`value` / `onChange`) or uncontrolled (`defaultValue`). The native
color input and presets emit normalized `#rrggbb`. The editable HEX field
accepts three or six digits, with optional `#`; Enter/blur commits and Escape
restores the current value. Invalid drafts show an associated error without
changing the selected color. `showHex={false}` restores the compact swatch UI.

Supports `presetColors`, `showPresets`, `showValue`, `disabled`, `name`, `id`,
`required`, `description`, `error`, and `aria-label` for a hidden label. The ref
targets the native form input. Typed `classNames` and compatible `styles` cover
every styled part; inspect `data-slot="color-picker-*"`. Slot comments identify
the element and conditional visibility. The browser's native dialog is outside
these DOM slots. Root priority is defaults, `classNames.root`, then `className`.

### GradientMaker

Controlled through `value: GradientValue` and `onValueChange`, or uncontrolled
through `defaultValue`. `GradientValue` is `{ colors: string[]; angle: number }`;
stops are evenly spaced and angles are rounded/clamped to 0–360. Three-digit HEX
values normalize before reaching native inputs. Invalid colors are omitted;
an empty result uses the default purple pair. Nonfinite angles fall back to 90.

The existing `onGradientChange` emits complete CSS on the same user edits.
Neither callback fires on mount or when a controlled value changes externally.
The three built-ins are Sunset Orange (two colors), Ocean Blue (three), and
Rainbow (seven), in that order. Omit `presets` to use them; supply your own
array to replace them, or `[]` to hide the choices. A preset's optional `angle`
applies on selection; without it, selection preserves the current editor angle.
Thumbnails stay fixed at their explicit angle or 90 degrees. Angle edits affect
the active gradient only. Invalid/empty preset entries are omitted.

`showPresets`, `showColors`, `showAngle`, `showHex`, and `showCopy` control sections.
`disabled` locks editing while allowing CSS copying. The angle uses a native
range input with arrow/Home/End support. HEX drafts behave like ColorPicker.
Copy success/failure is announced in a status message. Typed `classNames` and
compatible `styles` cover all styled parts with `data-slot="gradient-maker-*"`;
all markers are inline. Root class priority matches ColorPicker.

```tsx
"use client";

import { useState } from 'react';
import { GradientMaker } from 'react-a2z';
import type { GradientValue, GradientMakerClassNames } from 'react-a2z';

const classes: GradientMakerClassNames = {
  preview: 'h-40 rounded-2xl',
  hexInput: 'rounded-xl border-violet-300',
  angleInput: 'accent-violet-600',
};

export function CoverEditor() {
  const [value, setValue] = useState<GradientValue>({
    colors: ['#7c3aed', '#db2777'], angle: 120,
  });
  return <GradientMaker value={value} onValueChange={setValue} classNames={classes} />;
}
```

### Md / MdEditor

Markdown renderer (with syntax highlighting) and editor. Editor exposes
`MdEditorHandle`, `MdEditorMode`, `MdEditorToolId`.

### CodeBox

Read-only code block with lightweight syntax coloring and a copy button.

- **Boundary:** `CodeBox.tsx` is **hook-free**, so it is a Server Component — the
  coloring runs on the server and only `CodeBoxCopyButton` (internal,
  `"use client"`) ships to the client. Do **not** add `"use client"` to
  `CodeBox.tsx`. This is the reference example of the client-boundary policy.
- **Props:** `code`, `language` (`ts | tsx | js | py | bash | css | json`),
  `filename`, `showLanguage`, `copyable` (default `true`), `wrap`, `highlight`
  (default `true`), `labels={{ copy, copied, error }}`, plus `classNames` /
  `styles` slots for `root | header | filename | language | pre | code |
  copyButton`.
- **Reuses** `highlightCode()` from `Md` — the same zero-dependency colorizer, so
  there is no second tokenizer to keep in sync.
- **Copy** uses the shared public `copyToClipboard` util, which falls back to a
  temporary textarea when `navigator.clipboard` is unavailable (non-secure
  contexts, e.g. plain-http LAN/device testing).
- **Known limitation:** the token colors (`text-sky-300`, `text-emerald-300`,
  `text-amber-300`, `text-gray-400`) are baked into `highlightCode`, so they are
  **not** reachable through `classNames` — CodeBox is effectively dark-only
  until the syntax palette moves to CSS variables.

### Modal

`CustomModal` + `GlobalModal` with Zustand store.

- **`placement` is a logical 3x3 grid:** `top-start`, `top-center`, `top-end`,
  `center-start`, `center`, `center-end`, `bottom-start`, `bottom-center`,
  `bottom-end`. `start` / `end` follow the writing direction, so `top-start` is
  top-left in LTR and top-right in RTL. Placement is implemented purely as flex
  alignment (`items-*` / `justify-*`) on the fixed wrapper.
- **Aliases kept for compatibility** (each equals a grid cell, these are not dead
  values): `auto` ≡ `center`, `top` ≡ `top-center`, `bottom` ≡ `bottom-center`.
- Other props: `size` (10 values), `backdrop` (`opaque | blur | transparent`),
  `variant` (`default | unstyled`), `scrollBehavior` (`inside | normal |
  outside`), `isDismissible`, `showCloseButton`, `isDraggable` /
  `headerDraggable`, `zIndex`, `stackable`, and `className` /
  `contentClassName` / `bodyClassName` / `backdropClassName`.
- **`setModalOpen` payload excludes `zIndex`** — the store computes stacking
  itself (`50 + 10` per layer). Passing `zIndex` there is a type error; use
  `CustomModal` directly if you need to pin it.
- **Known dead surface** (declared, read by no renderer): the store's
  `modalIconColor`, `modalTitleColor`, `modalBorderColor`, `modalBgIcon`,
  `modalIconName` and `modalDescription`, plus `CustomModalProps.stackable`
  (stacking is store-driven). Candidates for removal.

```tsx
// placement is a logical 3x3 grid; start / end follow the writing direction.
//   top-start    | top-center    | top-end
//   center-start | center        | center-end
//   bottom-start | bottom-center | bottom-end
<CustomModal isOpen={open} onClose={close} placement="top-start" title="Top start" />
<CustomModal isOpen={open} onClose={close} placement="bottom-end" title="Bottom end" />

// Pin the z-index by rendering CustomModal directly — the store computes it.
<CustomModal isOpen={open} onClose={close} placement="center-end" zIndex={70} />

// Through the store. NOTE the prop is `modalTitle` here, not `title`, and
// `zIndex` is rejected by the payload type — the store owns stacking.
setModalOpen({ modalTitle: "Settings", placement: "bottom-end", size: "md" });
```

### Toast

`GlobalToast` + `ToastItem` with Zustand store.

### PearlButton

Gloss hover + press. Ships `styles/pearl-button.css` (prefix `a2z-pearl-btn`).
Optional import: `react-a2z/PearlButton/styles.css`.

### Counter

Animated number. `number` counts up as plain text; `digits` renders an
odometer with one column per place. `inView` starts it on scroll (default
`true`). Exposes `start` / `reset` / `update` through a ref. Types:
`CounterVariant`, `CounterPlace`, `CounterInView`, `CounterHandle`.

`onStart` / `onEnd` are IDENTITY-SENSITIVE. An inline arrow is a new
function every render, which changes `run`'s useCallback identity, which
re-fires the effect that starts the animation, which calls `onStart()`,
which setStates -- an update loop ("Maximum update depth exceeded").
Memoize them with `useCallback`. Open design question in ROADMAP section 5:
hold them in refs internally so inline arrows Just Work.

### ClientLogger

Client-side logger (`Wrapper` component for debugging).

## Hooks (`src/hooks`)

- `useControllableState` — controlled/uncontrolled state in one hook; every
  stateful component uses this rather than a local `useState` pair
- `useDebounce` — debounced value
- `useDebouncedCallback` — debounced function
- `useElementSize` — ResizeObserver
- `useInView` — IntersectionObserver
- `useThrottle` — throttled value
- `useThrottledCallback` — throttled function
- `useWindowSize` — window resize

## Utilities (`src/utils`)

- `cn` — clsx + tailwind-merge, token-aware (**use everywhere for class merging**)
- `createCn` — build your own token-aware `cn` with extra class groups
- `a2zClassGroups` — the (intentionally near-empty) token class-group config
- `createRecipe` — slot-aware variant resolver (see below)
- `mergeRefs` — combine a forwarded ref with a local ref
- `copyToClipboard`
- `englishDigitsToPersian` / `persianToEnglishDigits`
- `formDataMaker`, `sanitizeNumericInput`, `truncateText`, `readFileAsDataUrl`

## Styling Model

- Components ship **Tailwind utility classes baked in** (not CSS files) except
  `PearlButton`, which has its own CSS because the effects can't be expressed
  cleanly with utilities.
- Consumers style by passing `className`, `classNames`, `style`, or `styles`.
  `cn()` guarantees consumer classes always win over defaults.
- New and migrated components use **design tokens** — `bg-primary-600`,
  `text-fg-muted` — never stock Tailwind palette colours. See **Design
  tokens** above. **Migration is in progress:** `Button`, `Input`, `Slider`,
  `ColorPicker`, `GradientMaker`, `Modal`, and the additional controls and
  display components above use tokens. `Counter` is guarded by the token scan.
  `Tooltip`, `Md`, `MdEditor`, `CodeBox`, `Toast`, and `ClientLogger` still have
  raw palette classes. Convert a component only when
  you can verify it in `test-app-for-lib` — the palette classes look fine,
  so nothing fails loudly if the token mapping is wrong.
- `tailwind.preset.js` maps the tokens to Tailwind names **for v3**.
  `tailwind.css` does the equivalent for v4 via `@theme inline` and sets
  `@source "./dist"` so v4 scans the compiled output.

## Build

- `npm run build` — typecheck, Rollup production output, and CommonJS declarations/preset
- `npm run rollup` — Rollup output only; does not generate the CommonJS type files
- `npm run dev` — watch mode
- `rollup.config.js` — `preserveModules: true`, `preserveModulesRoot: 'src'`,
  `terser({ compress: { directives: false } })` so `"use client"` survives.
- Two JavaScript outputs: `dist/cjs`, `dist/esm`, plus flattened ESM
  `dist/index.d.ts` and CommonJS `dist/index.d.cts` declarations.
- `preserveDirectives()` plugin re-adds `"use client"` / `"use server"` to each
  chunk because Rollup strips them.
- `external: ['clsx', 'tailwind-merge']` — **required**. `peerDepsExternal()`
  only externalizes peer dependencies; these are regular deps, and without
  the rule Rollup bundles them into `dist/esm/node_modules/...` and rewrites
  the import to a relative path. Node then parses that copy as CJS and the
  named export fails at load, crashing every consumer.

## package.json exports — subpath rules

Rollup flattens pure re-export modules — a file whose body is only
`export ... from ...` and has no code of its own — unless the file is an
explicit entry point. Under `preserveModules`, an interior barrel is therefore
not emitted as its own chunk: its exports are hoisted into the parent, and no
`X/index.js` is written. This is independent of `treeshake.moduleSideEffects`
and of `hoistTransitiveImports` (the latter is ignored under `preserveModules`).

**Correct shape (matches `./Button`, `./Input`, `./PearlButton`, `./Slider`, `./Tooltip`):**

```json
{
  "./Tooltip": {
    "types": {
      "import": "./dist/index.d.ts",
      "require": "./dist/index.d.cts"
    },
    "import": "./dist/esm/components/Tooltip/Tooltip.js",
    "require": "./dist/cjs/components/Tooltip/Tooltip.js"
  }
}
```

**Resolved (2026-10-05):** `./Modal`, `./Toast`, `./ColorPicker`, `./Md`,
`./MdEditor`, `./Counter`, and `./hooks` used to target a non-existent
`index.js`. Fixed by listing those barrels as explicit entry points in
`rollup.config.js` (the `entries` array). When you add a subpath export that
targets `X/index.js`, add `src/.../X/index.ts` to that array as well.

**Verification:**

```bash
npm test
npm run release:check
```

`npm test` performs a fresh full build and checks declared exports and selected
component contracts. `release:check` also validates the packed package, types,
and published baseline; changed content requires a reviewed version/plan as
described in [RELEASING.md](./RELEASING.md).

## CLI registry and consumer checks

`npm run registry:build` copies current Select, ColorPicker, and GradientMaker source and their dependencies
into `packages/react-a2z-cli/registry`. `npm run cli:test` rebuilds this registry
and checks installer behavior and Tailwind v3/v4 output. The CLI's `prepack` hook
runs those checks automatically for packing/publishing. A globally linked CLI
needs its registry rebuilt after source changes.

`add color-picker` and `add gradient-maker` install independent components while
sharing namespaced helpers in the configured utilities directory. Shared helper
edits survive both install orders, repair, and explicit component overwrite.
Generated imports point to local files and require no `react-a2z` runtime. The
registry's component list drives CLI help and accepted component names.

Run `npm run cli:apps:prepare` once, then `npm run cli:apps:check` to test the
packed local CLI in twelve fresh React consumers, including Next, Vite, webpack,
and legacy CRA. This checks CLI-generated source; it does not test library
imports. The [starter app guide](./tests/cli-apps/README.md) covers manual demos,
fixture updates, reports, and preview commands.

## Consumer Setup

### Tailwind v4 (recommended)

```css
/* globals.css */
@import 'tailwindcss';
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
│   │   ├── Select/               # styled/native picker; also copied by CLI
│   │   ├── shared/               # field + combobox primitives
│   │   ├── ...                   # additional form, panel, and display components
│   │   └── index.ts
│   ├── hooks/
│   ├── utils/                    # cn, digit converters, form helpers
│   └── index.ts
├── styles/
│   └── pearl-button.css
├── packages/react-a2z-cli/        # independently published installer + registry
├── tests/cli-apps/                # twelve consumer fixtures + compatibility scripts
├── release/                      # published baselines + consumer examples
├── RELEASING.md
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
| A symbol is exported from a SUB-barrel but not the parent barrel | It exists at runtime and is ABSENT from the root `dist/index.d.ts`, so `import { x } from "pkg/Sub"` runs but fails to typecheck (the subpath's `types` field points at the root `.d.ts`). Add it to `src/components/index.ts`. Being reachable via `export *` from `src/index.ts` does NOT put it in the type surface |
| Window `pointermove`/`pointerup` listeners leak if the component unmounts mid-drag | Fixed in `Slider` (track + thumb): the listeners are owned by a `useEffect` keyed on a `dragging` flag, with the per-drag logic carried in refs so the effect does not re-register while the value changes. Never move registration back into the `pointerdown` handler |
| `sed -i '/…$/a …'` silently no-ops on CRLF files | Repo is CRLF; `$`-anchored patterns fail. Use `cat > file <<'EOF'` rewrites or `node -e` scripts, never blind `sed` |
| Leftover `useState` + `useEffect(() => setX(true), [])` "mounted" flag | Remove it — `noUnusedLocals` catches it; SSR-safe code shouldn't need the pattern unless you branch on it |
| Tooltip content silently missing on first render because `container` is `null` | `createPortal` needs a DOM node; return `null` from `Tooltip.Content` when `container` is falsy (SSR-safe) |
| Tooltip never opens on hover, and `delayDuration` looks ignored | A shared `cancelTimers()` cleared **both** timers and was wired to `pointermove`. `pointermove` fires continuously while the pointer is over the trigger, so it cancelled the pending *open* unless the pointer stopped dead on arrival — worst with a long `delayDuration`, which is why the delay prop appeared broken. `pointermove` must clear only the close timer (`cancelCloseTimer`). Fixed in `Tooltip` |
| Rollup bundles `clsx` / `tailwind-merge` despite `peerDepsExternal()` | Only peer deps are externalized. Add `external: ['clsx', 'tailwind-merge']` to the JS config; the bundled copy is parsed as CJS and the named export fails at load |
| Tokens declared in `:root` but no utility is generated (v4) | Tailwind v4 only generates utilities from `@theme`. Use `@theme inline` in `tailwind.css` so `--a2z-*` stays the only override path |
| An unknown prop silently no-ops (`next dev` still returns 200) | `next dev` does not type-check; React 19 passes unknown props through to the DOM as no-ops. Run `next build` or grep the built `d.ts` before trusting a demo |
| Render-prop `className` arrives pre-merged (contains the default `bg-surface`) | Appending a raw `bg-*` class loses -- both sit on the element and stylesheet order decides. Override with inline `style`, or re-merge through `cn(props.className, "...")`. The `classNames` prop is unaffected: it is merged inside the component by `cn()` |
| Tooltip forces `open`/`defaultOpen` on first render -> hydration mismatch | React does not render portals on the server. With `open`/`defaultOpen` true on the first paint, the server HTML has no tooltip node while the client's does. Gate the first render on a `mounted` flag (false on server and first client render, true in an effect), or start closed. The internal `container === null` guard covers the no-DOM case but not a consumer forcing `open` |
| Tooltip mispositioned when portaled into a `transform` / `filter` / `perspective` subtree | Those properties make the element a containing block for `position: fixed` descendants, so the tooltip resolves viewport-relative coords against that box. Default `document.body` avoids it; if you must target something else, portal into an untransformed ancestor |

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

Then run the token-layer harness. It checks exports, token-aware `cn`,
the slot recipe, and that no migrated component emits a raw palette colour:

```bash
node scripts/verify-tokens.mjs
```

Expected: `All checks passed.` A bare `node -e "... !fs.existsSync ..."`
one-liner fails here — bash expands `!` (history expansion) before node sees
it. Keep the check in a script file, as above.

## When Extending the Library

If you add a new component:

1. Create `src/components/NewComponent/NewComponent.tsx` + `index.ts`.
2. Follow the House Style above (forwardRef, cn, useId, controlled/uncontrolled, disabled, className).
3. Bake in default classes from **design tokens** (`bg-primary-600`,
   `text-fg-muted`), never a raw palette colour. Add a token to `tokens.css`
   first if one is missing, then map it in `tailwind.preset.js` (v3) **and**
   the `@theme inline` block in `tailwind.css` (v4).
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
- **One token layer:** values live only in `tokens.css`; v3 and v4 both map
  names onto the same variables, so there is no second source of truth.
- **Accessible by default:** labels auto-linked, focus rings, keyboard handlers,
  proper ARIA roles.
- **One required import, documented:** consumers import `react-a2z/tailwind.css`
  (v4) or add the preset + token stylesheets (v3). Utilities come from Tailwind;
  no component CSS is loaded behind your back.
- **Composability over configuration:** expose `Slider.Track`, `Slider.Thumb`, etc.
  rather than a giant props matrix.
