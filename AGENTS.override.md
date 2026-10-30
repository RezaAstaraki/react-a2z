# User-approved library guidance

The original `AGENTS.md`, DSH skills/rules, and legacy agent Markdown files were explicitly excluded by the user. This override preserves those files for other tools without applying their instructions to Codex.

Before creating or editing components, read `.cursor/rules/component-design.mdc`. The user approved its conventions: rich defaults, typed and fully overridable classNames slots, stable data-slot markers, correct interaction cursors, accessibility, and reduced motion.

When changing demo behavior, also read `../test-app-for-lib/.cursor/rules/component-demos.mdc`. The Select demo and playground are the approved reference.

Build components and their requested demos as one usable developer experience: typed behavior/state APIs, complete overridable slots, accessible interactions, and visible results. The demo must start with **Try it live**, using **Props**, **classNames**, and **Code** to teach configuration and customization before the focused examples. The referenced rules contain the full acceptance criteria.

Include CLI delivery for components in the requested scope: generate registry entries from current library source, include every local helper dependency, preserve edited shared helpers, validate both Tailwind majors and packed consumers, and update CLI/help/demo installation docs. Current registry commands are `add select`, `add color-picker`, and `add gradient-maker`. Use checkout commands for unpublished additions; do not imply that `npx ...@latest` contains local edits.

Keep this repository's component-design rule synchronized with `../test-app-for-lib/.cursor/rules/component-design.mdc`. Record newly approved conventions in these rules so future component work follows them.

These files are referenced explicitly; do not assume Codex automatically loads `.cursor/rules`.

## Color tools checkpoint — 2026-10-29

GradientMaker defaults are Sunset Orange, Ocean Blue, then Rainbow. Thumbnail
angles stay fixed; applying a preset without an angle preserves the current
editor angle. Omitted `presets` uses built-ins; `[]` hides them. Keep source and
the generated CLI registry synchronized. See `LIBRARY-REFERENCE.md` for the
component contract and `ROADMAP.md` for pending work and validation evidence.

The demo's scoped live Tailwind compiler belongs to `test-app-for-lib` only.
Do not add that server endpoint/compiler to the package or CLI-installed source.
The 2026-10-30 phase below implements the next two usability priorities.
The user has now authorized the final validation pass. Current results and
remaining gates are recorded at the top of ROADMAP.md. The user explicitly authorized committing this
checkpoint; this does not authorize pushing or publishing.

## Current validation status — 2026-10-30

The user approved cleanup and the deferred full checks. See ROADMAP.md's top
validation section: package tests/CLI, demo lint/unit/example checks, production
build and browser suites passed. The live compiler needed traced filesystem
paths because webpack rewrote require.resolve; keep the production check.
A2Z_DIST_DIR=.next-validation isolates production from the active dev server.
The separate Next fixture upgrade to 16.4.3 is committed as dd8ad95. All twelve
consumer production builds/typechecks and 180 CLI checks now pass; no framework
security guard was bypassed. ROADMAP.md links the proposed library 2.0.0 review
and draft plan. Package versions remain unchanged and the release gate still
requires a finalized version/plan/fingerprint. The CLI npm query returned E404,
so its manifest 0.2.0 is not a confirmed published baseline. Demo/parent starter
Next upgrades remain separate dependency work.
StoreBinding remains outside the package; integration belongs to the demo app.
The user has now authorized a local checkpoint commit, a separate Next.js
fixture update and release-version review. No push/publication is authorized.

## App-owned persistence decision — 2026-10-30

After the checkpoint, the user established that persistence belongs to the
consuming app. Package components expose value/defaultValue, change callbacks
and supplied data such as presets; the app owns storage, saved collections and
Save/Delete UI. Do not add a built-in persistor, storage helper/dependency or
persistence-specific component API for GradientMaker. Its existing value,
onValueChange and presets provide the integration points. Component-local undo
history remains session state. The user approved a controlled-API guide and an optional Zustand persistence
example in the demo app; the implementation details are recorded below.
The completed checkpoint includes the demo page-width adjustment. Future edits
require a new commit request. No push/publication is authorized; broad checks
remain deferred.

## Optional Zustand demo integration — 2026-10-30

The user approved documenting controlled integration first and adding one
app-owned Zustand example. `GradientPersistenceExample.tsx` and
`gradient-persistence-store.ts` live only in test-app-for-lib. A per-instance
factory uses persist/partialize/skipHydration, explicit version/shape validation,
and a write gate; invalid/future data stays untouched until explicit Reset.
The demo stores last value and up to 12 named/unnamed favorites, with app-owned
Save/Load/Delete/Reset controls. Undo/styles/UI state stay temporary. Read/write
failures preserve session editing. Zustand 5.0.15 is declared directly in the
demo, without changing package component APIs, dependencies or CLI source.
`scripts/gradient-persistence-code.mjs` generates exact standalone TypeScript
from the two running source files into GradientMaker.tsx. Regenerate with
`npm run examples:persistence`; pretest:examples checks for drift. Long code uses
CompactExampleCode's full-screen reader/copy flow. Focused unit/browser checks
are documented in the demo roadmap. The user authorized a local checkpoint commit of this work. Validation results
and remaining gates are at the top of ROADMAP.md; no push/publication is authorized.

## Completed numeric angle/history phase — 2026-10-30

The user approved numeric angle input and undo/redo next. Both now live in
GradientMaker, with `showAngleNumber` and `showHistory` (default true), typed
slots, and generated CLI delivery. Valid numeric angles update the slider/preview live. Enter/blur finishes a
grouped edit; invalid drafts preserve output and Escape restores the last valid
angle. History stores 50 complete
values, groups continuous slider/native color interactions, clears redo on new
edits, and resets on external controlled values. Hiding history preserves it;
text/number fields retain native undo. The compact header keeps the default
component visible during sticky class inspection. See the roadmaps for checks.
Visible preset labels are implemented in the section below; saving gradients belongs to the consuming app. The user authorized a local checkpoint
commit of this phase, including the staged demo page-width adjustment. Future
changes require a new commit request; pushing/publishing is not authorized.

## Custom history button content — 2026-10-30

The user requested removable text and replaceable icons. `undoLabel`/`redoLabel`
accept strings (empty hides text); `undoIcon`/`redoIcon` accept decorative React
nodes/SVG (null hides). Expose independent label/icon slots and wrappers.
`undoAriaLabel`/`redoAriaLabel` provide accessible names with nonblank fallbacks.
Props supports text/symbol/accessibility fields, icon-only/text-only actions and
content reset without changing history. JSON accepts string/null icons and
older configs receive defaults; never execute arbitrary JSX from editors. The
minimal focused example demonstrates actual custom SVG nodes and hidden labels.
The user authorized a local checkpoint commit; broad validation remains deferred.

## Optional preset names — 2026-10-30

The user requested optional names and prop-controlled visibility. `GradientPreset.name`
is optional; `showPresetNames` defaults to false and displays only nonblank names.
`presetName` exposes classNames/styles and the stable span data-slot. Unnamed
choices receive numbered accessible labels. Props/Code accept omitted or blank
names, reject non-string names, and preserve omissions in exports. The visible
label, button styling, slot map, complete studio presets, CLI source and prop
metadata are coordinated. The user authorized a local checkpoint commit; full validation stays deferred.

## Completed color-stop/class-information phase — 2026-10-30

The user chose only color-stop editing and clearer class information for this
phase. GradientMaker now adds/removes/reorders evenly spaced colors through the
existing value/callback contract; `showColorActions` and `maxColors` control the
actions. New slots and CLI registry source/types/help are included. The demo
compares real reference/preview DOM classes rather than copied default strings.
See the roadmaps and technical reference for details and focused check evidence.
Numeric angle input, undo/redo, visible preset names, saving gradients, stop
positions and alternate gradient types are outside this phase. The user authorized
a local commit of this phase on 2026-10-30. Future changes still require their own
commit request. Broad/production/release validation remains deferred; no push or
publication is authorized.

Respect the user's current validation and delivery instructions. Dev-only work pending confirmation must stay dev-only until approval; earlier push authorization does not override that restriction.
