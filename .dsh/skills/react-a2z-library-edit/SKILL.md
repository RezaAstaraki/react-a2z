---
name: react-a2z-library-edit
description: Use when editing, adding, or changing a component, hook, or utility in the react-a2z library — covers house style, barrels, design tokens, package.json#exports, the Rollup build, and post-build verification.
whenToUse: The task edits files under react-a2z/src/, adds a component, changes a component's props or styling, or touches src/components/index.ts or rollup.config.js.
---

# react-a2z library edit

Protocol for editing or adding a component in the `react-a2z` library.

## Canonical doc — grep these exact headings (never read the 651-line file whole)

Confirmed anchors in `skills/web/react-a2z/SKILL.md`:

    grep -n '^## House Style'      skills/web/react-a2z/SKILL.md   # line 72
    grep -n '^## Common Pitfalls'  skills/web/react-a2z/SKILL.md   # line 542

Other headings, same pattern (each matches exactly one heading):

    grep -n '^## Design tokens'    skills/web/react-a2z/SKILL.md
    grep -n '^## Barrel'           skills/web/react-a2z/SKILL.md
    grep -n '^## Build'            skills/web/react-a2z/SKILL.md
    grep -n '^## package.json'     skills/web/react-a2z/SKILL.md
    grep -n '^## When Extending'   skills/web/react-a2z/SKILL.md
    grep -n '^## Consumer Setup'   skills/web/react-a2z/SKILL.md
    grep -n '^## Components'       skills/web/react-a2z/SKILL.md
    grep -n '^## File Structure'   skills/web/react-a2z/SKILL.md

Then slice: `sed -n 'A,Bp' skills/web/react-a2z/SKILL.md`.

For a single component, use two headings as bounds:

    grep -n '^### Tooltip'     skills/web/react-a2z/SKILL.md
    grep -n '^### ColorPicker' skills/web/react-a2z/SKILL.md
    sed -n '<first>,<second-1>p' skills/web/react-a2z/SKILL.md

## Read before predicting

Never predict a component's shape or prop names from memory — read the file.

1. `src/components/<Name>/<Name>.tsx` and its `index.ts`.
2. The matching `### <Name>` section in the canonical doc (grep above).
3. `src/components/index.ts` — the sub-barrel surface.

## House style — non-negotiable

- `import * as React from 'react'` — never named imports from React.
- `React.forwardRef<HTMLElement, Props>` for anything rendering a DOM node.
- `Component.displayName = 'Component'`.
- `"use client"` ONLY when hooks/state/browser-API/portal are genuinely needed.
  Never on a presentational primitive. `CodeBox.tsx` is the reference example
  of a hook-free Server Component.
- Class merging via `cn` from `../../utils`. Never `.filter(Boolean).join(' ')`.
- Baked-in classes come from design tokens (`bg-primary-600`, `text-fg-muted`,
  `border-border`) — never a raw Tailwind palette colour.
- Consumers win: `className`, `classNames`, `style`, `styles`.
- Controlled + uncontrolled via `useControllableState` from `../../hooks`.
- `useId()` for label ↔ input ↔ aria wiring.
- `ref={mergeRefs(forwardedRef, localRef)}` — never `forwardedRef ?? rootRef`.
- Types use `export type { ... }` — never mixed with values in one statement.
  This is the #1 build error in this repo.
- JSDoc lives on the PROP, not the type alias.

## Edit sequence

1. Edit `src/components/<Name>/<Name>.tsx`.
2. Update `src/components/<Name>/index.ts`:

       import <Name> from './<Name>';
       export type { <Name>Props } from './<Name>';
       export { <Name> };
       export default <Name>;

3. Add the new symbol to `src/components/index.ts` (value + type, split).
   A symbol reachable via `export *` but missing here is absent from the root
   `dist/index.d.ts` and fails consumer typecheck.
4. New component: add a `package.json#exports` subpath. If it targets
   `X/index.js`, add `src/.../X/index.ts` to the `entries` array in
   `rollup.config.js` — barrels are emitted only as explicit entries.
5. New token needed: add to `tokens.css`, then map it in BOTH
   `tailwind.preset.js` (v3) AND the `@theme inline` block in `tailwind.css` (v4).

## Verify — run after every edit

    npm run rollup

Pass conditions:

- No `TS2322` / `TS2345` from `src/components/**`.
- Every `package.json#exports` subpath resolves:

      node scripts/verify-tokens.mjs

- Token layer clean (no raw palette colours in migrated components).

**The consumer app (`../test-app-for-lib`) does not see the change until
`npm run rollup` runs AND the browser is hard-refreshed — HMR does not cross
the `file:` symlink.**

## Traps that have burned this repo

- `sed -i '/...$/a ...'` silently no-ops on CRLF worktrees. Use full rewrites.
- `node -e` with `!` triggers bash history expansion. Put the script in a file.
- `<Name>Props` imported as a value in the same statement as `<Name>` — split it.
- Rollup bundles `clsx` / `tailwind-merge` unless `external` names them
  (`peerDepsExternal()` only externalizes peers). The bundled copy is parsed
  as CJS and the named export fails at load in every consumer.
- `key={index}` on dynamic lists — use a stable id.
- `alert()` in components — inline state + timeout, cleanup on unmount.
- Inline `<style>` per render — hoist keyframes once, prefix `a2z-`.
- Render-prop `className` arrives pre-merged (contains defaults). Appending a
  raw `bg-*` loses; use inline `style` or re-merge via `cn(props.className, ...)`.
