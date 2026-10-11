# React A2Z CLI starter apps

Twelve runnable consumer apps exercise the **packed local CLI**, not the globally
linked command or the published npm version. Nothing here publishes a package.
Each app imports the component source installed by the CLI; none depends on the
`react-a2z` runtime package.

Requires Node 22.12+ (the suite uses Node 22.18) and npm workspaces.

## First setup

From the **react-a2z repository root**:

```sh
npm ci
npm run cli:apps:prepare
npm run cli:apps:check
```

`cli:apps:prepare` creates missing starter folders, packs the CLI, installs the
modern and legacy dependencies, and initializes apps that have no `a2z.json`.
It preserves already initialized apps and their edits. Run it on a fresh checkout
or after adding a scenario.

The remaining commands in this guide run from `tests/cli-apps` unless specified.
`candidate` runs `npm pack` on `../../packages/react-a2z-cli`, including its
real prepack checks, and saves the tarball under `.artifacts`. The apps already
declare `clsx` and the appropriate `tailwind-merge` major, so `setup` uses
`--skip-install`. It keeps initialized apps and consumer edits intact.

`verify` creates disposable fresh apps using the same starter definitions. It
checks dry runs, automatic initialization, src/root defaults, repeated init,
overwrite protection, repair previews, preservation of consumer edits, repeated
repair, and explicit component overwrite. It uses the actual installed Tailwind
version for each workspace. It does not modify the runnable apps.

## During development

After changing the CLI, registry builder, or components used by the registry,
run these from the repository root:

```sh
npm run cli:test
npm run cli:apps:check
```

`cli:test` is the fast integration and Tailwind compilation check.
`cli:apps:check` repacks the current source, installs that exact candidate, and
runs all 108 CLI checks **plus TypeScript and production builds in twelve fresh,
disposable apps**. This compiles newly generated components, helpers, and styles
on every run. The committed interactive apps are preserved. Any failing check
exits with an error; inspect `reports/cli.json` and per-scenario build/typecheck
logs. Candidate filenames contain a content hash, preventing npm from reusing
an older tarball with the same version.

For a quick rerun with the installed candidate, use `npm run verify`.
To include fresh builds without repacking, use `npm run verify -- --build`.
Browser interactions are checked separately: run a starter and follow the steps
below. The full command automates CLI behavior and compilation checks.

This larger suite runs when you invoke it; it is not added to publishing hooks.
Run it before releasing CLI or registry changes. Existing CLI prepack and main
library prepublish gates remain active. For main library changes also run its
`npm test`, then follow `../../RELEASING.md` to choose and validate a version
bump. This suite does not decide semver or publish anything.

`build:all` and `typecheck:all` check every interactive app, continue after failures, and write
JSON results to `reports`. CLI verification is separate from version policy:
passing these checks does not decide the correct semver bump.

The eleven modern apps share npm workspaces. CRA has its own install and lockfile
because its TypeScript 4 peer requirement conflicts with the modern TypeScript 5
toolchain. This keeps both dependency trees valid. For clean reinstalls, run
`npm ci` here and `npm ci` inside `apps/cra-src-tw3` after packing the candidate.

## Run an app

```sh
npm run dev -- next-app-root-tw4
```

Run `npm run dev` without an argument to list scenarios and ports. Stop an app
with Ctrl+C. Open its URL and try the plan picker, arrow keys, disabled Enterprise
option, selected-plan feedback, disabled control, validation state, and custom
slot classes. These are focused installation smoke demos; the complete component
playground remains in `../../../test-app-for-lib`.

After building, `npm run preview:all` serves all twelve production builds on
the same ports. Stop it with Ctrl+C before starting a dev server on those ports.
For a background preview, `npm run preview:stop` checks its recorded process
identity and stops this suite's preview servers before you run a dev app.

- `next-app-src-tw3` — App Router, src, Tailwind 3, port 3101
- `next-app-root-tw4` — App Router, root, Tailwind 4, port 3102
- `next-app-src-tw4` — App Router, src, Tailwind 4, port 3103
- `next-app-root-tw3` — App Router, root, Tailwind 3, port 3104
- `next-pages-src-tw3` — Pages Router, src, Tailwind 3, port 3105
- `next-pages-root-tw4` — Pages Router, root, Tailwind 4, port 3106
- `vite-ts-src-tw3` — TypeScript, src, Tailwind 3, custom component/CSS paths, port 3107
- `vite-ts-src-tw4` — TypeScript, src, Tailwind 4, port 3108
- `vite-js-root-tw4` — JavaScript entry, root, Tailwind 4, generated TypeScript components, port 3109
- `react-webpack-root-tw4` — plain React with webpack, root, Tailwind 4, port 3110
- `react-webpack-src-tw3` — plain React with webpack, src, Tailwind 3, port 3111
- `cra-src-tw3` — legacy Create React App 5, React 18, TypeScript 4.9, Tailwind 3, port 3112

CRA 5 supplies its own PostCSS pipeline and supports the Tailwind 3 setup tested
here. Tailwind 4 with CRA's unmodified pipeline is not a supported scenario.
The modern apps use React 19. Next apps cover all four App Router combinations
of src/root and Tailwind 3/4, plus both Pages Router layouts. Configs exercise
TypeScript exports, CommonJS configs, Next stylesheets, Vite stylesheets, and
explicit custom paths. This is a representative compatibility suite, not an
exhaustive claim about every framework or configuration.

## Try a CLI command yourself

From an app directory, use the suite's packed candidate:

```sh
node ../../node_modules/react-a2z-cli/bin/cli.js repair --dry-run
node ../../node_modules/react-a2z-cli/bin/cli.js add select --dry-run
```

Since Select is already installed, `add select` correctly refuses to replace it.
Only use `--overwrite` when you want to discard changes to generated components.
Use `repair` to update setup while retaining component/helper edits. Restart a
running dev server after changing Tailwind configuration.

The interactive apps contain committed copies of generated component source.
To update their styles, use `repair`. To replace a component after reviewing
your local edits, use `add select --overwrite`. `setup` keeps initialized apps;
`cli:apps:check` tests fresh generated source independently of these copies.

## Git and new scenarios

Commit source, app configs, `a2z.json`, generated component/helper/style fixtures,
scripts, this guide, and both modern/CRA lockfiles. The CRA `.env` contains only
its public local port, host, and browser settings. Dependencies, `.artifacts`,
temporary `.checks`, build output, backups, logs, and reports are ignored.

To add coverage, add a scenario in `scripts/scenarios.mjs` and extend
`scripts/scaffold.mjs` if the framework needs a new adapter. Then run
`npm run cli:apps:prepare` and `npm run cli:apps:check` from the repository root.
Review and commit the new app, scenario definition, and updated lockfiles.
Keep existing edits in the interactive apps under review with `git diff`.
