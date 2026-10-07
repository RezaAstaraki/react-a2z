# ROADMAP — react-a2z

Living work list. Edit in place, check items off, delete what is done. This file
is NOT published (`package.json#files` excludes it) — it is internal coordination.

Companion docs: `SKILL.md` (library API + house style), `AGENTS.md` (repo rules),
`HANDOFF.md` (session protocol + log of what happened).

## Where things stand (updated 2026-10-07)

- The token layer is done and proven: `tokens.css` is the single source of
  values, mapped for v3 by `tailwind.preset.js` and for v4 by the
  `@theme inline` block in `tailwind.css`.
- **5 of 14 components are migrated**: `Button`, `Input`, `Slider`,
  `ColorPicker`, `GradientMaker`.
- **7 still emit raw palette classes**: `Modal`, `Toast`, `Tooltip`, `Md`,
  `MdEditor`, `CodeBox`, `ClientLogger`. (The verifier counts these as 9
  *files* — `Md` and `CodeBox` each have a second file with palette classes.)
- **2 are already clean but are NOT in `MIGRATED`**: `Counter` and
  `PearlButton`. They emit no palette classes, so the verifier neither flags
  nor checks them. See the note in section 1.
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

**Known gap — the verifier only scans `.tsx`.** `PearlButton`'s styling lives
in `styles/pearl-button.css`, not in utilities, so the harness cannot see it.
That CSS was migrated to tokens, but nothing guards it: if it regresses the
harness stays green. Same class of bug this section was written to fix — the
net guarding the wrong thing. Either extend the scan to `styles/**/*.css` or
add a manual note to the checklist.

**Also unlisted:** `Counter` is clean but appears in neither `MIGRATED` nor
the pending list. Add it to `MIGRATED` so it is actually guarded rather than
clean by luck.

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
- [x] `GradientMaker`
- [ ] `Md`
- [ ] `MdEditor`
- [ ] `CodeBox` (blocked on step 3)
- [ ] `ClientLogger`

**Slot coverage is partial.** GradientMaker ships eleven `classNames` /
`styles` slots; the demo exercises **three**: `preset` (via both
`classNames.preset` and `styles.preset`), `preview` and `copyButton`. Still
unexercised: `root`, `label`, `presets`, `customColors`, `swatch`, `angle`,
`copyRow`, `copyInput`.

**Open API question (discussed, not implemented).** GradientMaker is
uncontrolled-only and always renders the copy row, while ColorPicker has
`value` / `defaultValue` and `show*` flags. Proposed, matching ColorPicker:

- `showCopy?: boolean` — hides the whole copy row
- `defaultValue?: string[]` — seed the stops
- `defaultAngle?: number` — seed the angle

A fully controlled `value` is a larger question: the gradient is two pieces
of state (colours + angle), so it would need a `{ colors, angle }` shape.

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
