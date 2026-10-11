# User-approved library guidance

The original `AGENTS.md`, DSH skills/rules, and legacy agent Markdown files were explicitly excluded by the user. This override preserves those files for other tools without applying their instructions to Codex.

Before creating or editing components, read `.cursor/rules/component-design.mdc`. The user approved its conventions: rich defaults, typed and fully overridable classNames slots, stable data-slot markers, correct interaction cursors, accessibility, and reduced motion.

When changing demo behavior, also read `../test-app-for-lib/.cursor/rules/component-demos.mdc`. The Select demo and playground are the approved reference.

These files are referenced explicitly; do not assume Codex automatically loads `.cursor/rules`.

Respect the user's current validation and delivery instructions. Dev-only work pending confirmation must stay dev-only until approval; earlier push authorization does not override that restriction.
