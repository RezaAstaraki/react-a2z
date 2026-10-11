# react-a2z-cli

Copy editable React A2Z component source into your project. The component code
lives in your project, so you can customize it directly.

## Requirements

- Node.js 18 or newer.
- An existing React project with Tailwind CSS **v3.4.1+ or v4** already installed and configured.

The CLI detects the installed Tailwind version before writing anything. For v3,
it copies token CSS and a local preset, adds that preset to your existing Tailwind
config, and extends its content paths. For v4, it copies `@theme` mappings and
explicit source paths, importing them after Tailwind. It does not upgrade
Tailwind or replace your PostCSS setup. Dependency installation uses
`tailwind-merge` v2 for Tailwind v3 and v3 for Tailwind v4.

## Install a component

Run from your app's root directory:

```bash
npx react-a2z-cli@latest init
npx react-a2z-cli@latest add select
```

Currently supported: **Select**. `add select` also initializes the project if needed.
The installer adds `clsx` and `tailwind-merge` using your package manager.

When your app has a `src` directory, it creates:

- `src/components/ui/select.tsx` and `field.tsx`
- `src/lib/react-a2z/cn.ts` and `extend-merge.ts`
- `src/styles/react-a2z.css`
- `a2z.json` with the configured paths

For apps without `src`, it uses `components/ui`, `lib/react-a2z`, and `styles`
at the project root. Existing `a2z.json` paths take precedence.

It adds a style import to an existing global stylesheet, including Next App
Router/Pages Router and Vite conventions. Use `--css` for other locations.
If no configured Tailwind stylesheet is found, it stops before writing files.
You do not need to install the `react-a2z` runtime package.

```tsx
import { Select } from "./components/ui/select";
```

## Options

```bash
npx react-a2z-cli@latest --help
npx react-a2z-cli@latest add select --dry-run
npx react-a2z-cli@latest init --path src/components/custom-ui
npx react-a2z-cli@latest add select --cwd ./my-app
npx react-a2z-cli@latest init --css src/custom.css --tailwind-config config/tailwind.config.ts
```

- `--dry-run`: preview paths without writing files or installing dependencies.
- `--skip-install`: write files without installing dependencies.
- `--overwrite`: allow replacing generated files; existing files are protected by default.
- `--path`: set the component directory during initial setup.
- `--cwd`: use a different app directory.
- `--css`: select an existing global Tailwind stylesheet.
- `--tailwind-config`: select an existing Tailwind v3 config when it has a custom path.

Edit `a2z.json` to change paths after initialization.

## Repair an existing setup

If an earlier CLI generated v4 styles in a v3 app, or you change Tailwind major
versions, preview and repair the setup:

```bash
react-a2z-cli repair --dry-run
react-a2z-cli repair
```

Repair preserves your component files and existing helper source. It updates the
managed style block, preset/config wiring, metadata, and matching dependencies.
Changes outside the managed style block are retained. Existing changed files get
`.a2z-backup` copies. Unrecognized/custom styles or presets require an explicit
`--overwrite` after review; components are still preserved by `repair`.

The CLI parses JavaScript/TypeScript Tailwind configs without executing them.
CommonJS exports, default exports, and a config variable are supported. Existing
theme, plugins, presets, and content entries are retained. Dynamic exported
configs or dynamic arrays, prefixed classes, and selector-scoped `important`
require manual integration; the CLI stops before writing files. A missing React
project, unsupported Tailwind version, or unconfigured global CSS also stops
before writing. A dry run creates no files and installs no dependencies.

## Publishing (maintainers)

The library (`react-a2z`) and installer (`react-a2z-cli`) are separate npm packages
with independent versions. Publishing the library does not publish the installer.
See the repository's [versioning checklist](../../RELEASING.md) when choosing a bump.

From the **repository root**, preview the CLI package:

```bash
npm run cli:check
```

Then publish the CLI:

```bash
npm run release:cli
```

The CLI's `prepack` hook rebuilds its registry from the current library source and
runs the CLI integration test before npm packs or publishes it. A failed build or
test prevents publishing. These commands must run from a full repository checkout;
consumers do not need the build scripts to use the published CLI.

For subsequent CLI releases, bump only its version before publishing:

```bash
npm --prefix packages/react-a2z-cli version patch --no-git-tag-version
npm run release:cli
```

Use a minor version for compatible features and a major version for breaking
changes after reaching 1.0.0. During 0.x development, use a minor bump for breaking
changes. New CLI releases do not require a library version bump.
