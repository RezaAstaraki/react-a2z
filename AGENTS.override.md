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
Next priorities discussed with the user are color-stop editing and clearer
default/override/resolved class information; they are not implemented here.
Full tests, CLI consumer checks, and the demo production build remain deferred
to the final validation pass. The user explicitly authorized committing this
checkpoint; this does not authorize pushing or publishing.

Respect the user's current validation and delivery instructions. Dev-only work pending confirmation must stay dev-only until approval; earlier push authorization does not override that restriction.
