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
Full tests, CLI consumer checks, and the demo production build remain deferred
to the final validation pass. The user explicitly authorized committing this
checkpoint; this does not authorize pushing or publishing.

## Persistence discussion hold — 2026-10-30

The user requested a local commit of the completed numeric angle/history,
optional preset names and customizable history-content work. Include the staged
demo page-width adjustment. Stop after this checkpoint: discuss persistence /
the persistor with the user before implementing saving or choosing a storage
strategy. No persistence API, storage dependency or implementation is approved.
No push or publication is authorized; full validation remains deferred.

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
Visible preset labels are implemented in the section below; saving gradients is still pending. The user authorized a local checkpoint
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
