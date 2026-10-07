# ROADMAP — react-a2z

Living work list. Edit in place, check items off, delete what is done. This file
is NOT published (`package.json#files` excludes it) — it is internal coordination.

Companion docs: `SKILL.md` (library API + house style), `AGENTS.md` (repo rules),
`HANDOFF.md` (session protocol + log of what happened).

## Where things stand (2026-10-06)

- The token layer is done and proven: `tokens.css` is the single source of
  values, mapped for v3 by `tailwind.preset.js` and for v4 by the
  `@theme inline` block in `tailwind.css`.
- **4 of 14 components are migrated**: `Button`, `Input`, `Slider`, `ColorPicker`.
- The other 10 still emit raw Tailwind palette classes and do not re-theme.
- Slider also dropped its private `useControllableState` / `mergeRefs`
  copies; those shared utils now have no remaining private duplicates.

## 1. Invert the verifier — DONE (f5ea5f2)

The raw-palette assertion used to hardcode `Button.tsx` and `Input.tsx`, so it
guarded only the finished work and would report "All checks passed" while
anything else regressed.

- [x] `MIGRATED` array + disk scan; unmigrated files report as pending.
- [x] `from|to|via` added to the regex (gradient utilities were invisible).
- [x] `existsSync` per MIGRATED entry, so a rename cannot drop it silently.

Still to do: add each component to `MIGRATED` in the same commit as its
migration.

**Why it came first:** it was a contained change to one script and it made
every migration below safe. The net used to protect the finished work and
ignore the in-progress work — backwards.

## 2. Migrate the remaining components

One component at a time. Each: bake token classes, remove its exemption entry,
and **verify in `test-app-for-lib`** (hard refresh after `npm run rollup`).

- [ ] `Modal`
- [ ] `Toast`
- [ ] `Tooltip`
- [x] `Slider`
- [x] `ColorPicker`
- [ ] `GradientMaker`
- [ ] `Md`
- [ ] `MdEditor`
- [ ] `CodeBox` (blocked on step 3)
- [ ] `ClientLogger`

**Order:** most-used first (Modal, Toast, Tooltip); Slider is the most complex.
**Warning:** a wrong token mapping fails SILENTLY. Raw palette classes render
fine, so nothing fails loudly — the browser check is the only real guard.

## 3. Syntax palette to CSS variables (unblocks CodeBox + Md)

`highlightCode()` in `src/components/Md/` bakes syntax colours as literal
`text-sky-300` / `text-emerald-300` / `text-amber-300` / `text-gray-400`
classes, so CodeBox cannot be re-themed through `classNames`.

- [ ] Introduce `--a2z-syntax-*` variables in `tokens.css`.
- [ ] Map them in `tailwind.preset.js` (v3) and the `@theme inline` block (v4).
- [ ] Rewrite `highlightCode()` to emit them.
- [ ] Then migrate `CodeBox` and `Md`.

This is a real refactor, not a find-and-replace.

## 4. Prove global theming (untested)

Only a PER-INSTANCE override has been verified (the Button demo). Untested:

- [ ] `.a2z-dark` / `.dark` actually flips the whole UI.
- [ ] A global `:root` override re-themes every migrated component at once.

- [ ] Add a theme-switcher demo in `test-app-for-lib` that toggles both.

This is the headline README promise; it deserves a real test, not trust.

## 5. Publish prep

- [ ] **Major version bump.** The Button API changed incompatibly
      (`variant="filled-blue"` -> `solid` / `soft` / `outline` / `ghost` /
      `link`). Package is at 1.0.0; this needs 2.0.0.
- [ ] Add a CHANGELOG and a migration note for the Button variant rename.
- [ ] Track the five deprecations promised "for one major": `buttonType`,
      `errorMessage`, `inputClassName`, `labelClassName`, `readonly`.
      Remove them when 2.0.0 lands, or restate the promise.

## Rules that keep this list honest

- A migration is done only when it is verified in the consumer app, not when
  the build is green.
- Migrating a component that "looks fine" is the dangerous case — palette
  classes render correctly, so only a browser check catches a bad mapping.
- Shrink the verifier exemption list in the same commit as the migration.
