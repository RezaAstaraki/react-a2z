# AGENTS.md — react-a2z

Agent-facing rules for this repo. The human's own docs are `HANDOFF.md` (session
workflow, environment, git hygiene) and `skills/web/react-a2z/SKILL.md` — the
canonical library doc for API, house style, build pipeline,
`package.json#exports` subpath rules, and pitfalls. Read SKILL.md explicitly: it
is a **Hermes** skill, not a DSH skill, so nothing auto-loads it.

This is the component library, published as `react-a2z`. Its consumer/demo app
is a sibling repo, `../test-app-for-lib`, which depends on this one as
`file:../react-a2z`.

## ⚠️ HANDOFF.md §2/§3 are the human's chat protocol — not your instructions

`HANDOFF.md` presents §2 ("How I want you to communicate") and §3 ("How I want
you to give me file changes") as *"hard rules. Follow them every response."*
They were written for an assistant with **no filesystem access** that relays one
shell command at a time for the human to run in WSL.

If you have direct file tools, those two sections do not describe your job. Do
not hand over one command at a time, do not ask the human to `cat` a file, and
do not deliver edits as `cat > file <<'EOF'` heredocs. Read and edit files
yourself.

Still binding is the technical reality those sections encode:

- CRLF-aware edits; never blind `sed -i '/…$/a …'` (silently no-ops on CRLF).
  Prefer full rewrites, or a script file over `node -e` containing quotes.
- Back up before overwriting; delete leftover `*.bak` before committing — they
  show in `git status` by design.
- Stage only intended files (`git add <file>`), never `git add .`.
- Use `git --no-pager` to avoid the pager.

## Build and verify

Build: `npm run rollup`. Watch: `npm run dev`. After a build:

1. No `TS2322` / `TS2345` from `src/components/**`.
2. `dist/index.d.ts` carries every component + type name.
3. Every `package.json#exports` subpath resolves to an emitted file:

       node -e "const p=require('./package.json'),fs=require('fs'); for (const [k,v] of Object.entries(p.exports)) { if (typeof v!=='object') continue; if (!fs.existsSync(v.import)) console.log('MISSING', k, v.import); }"

   No output = all subpaths resolve.
4. Barrels (`./Modal`, `./Toast`, `./ColorPicker`, `./Md`, `./MdEditor`,
   `./Counter`, `./hooks`) are emitted only because they are explicit entry
   points in `rollup.config.js`. If a subpath regresses, check that its
   `src/.../X/index.ts` is still in that `entries` array. Note this is
   independent of `treeshake.moduleSideEffects` and of
   `hoistTransitiveImports` (the latter is ignored under `preserveModules`).

A change here is not visible to `../test-app-for-lib` until `npm run rollup`
runs **and** its browser is hard-refreshed — HMR does not cross the `file:`
symlink.

## Environment

- Windows host + WSL. Commands in this repo work in either shell. The consumer
  app is stricter: its `next dev` must run on Windows, because its
  `node_modules` holds win32 native binaries (`lightningcss`,
  `@tailwindcss/oxide`).
- Never copy `node_modules` between machines. Always `npm install` on the target
  platform.
- Remote: `origin` → `https://github.com/RezaAstaraki/react-a2z.git`. Branch
  `main`, tracking `origin/main`. Auth is a classic PAT (`repo` scope) over
  HTTPS, picked up via `credential.helper = manager`.
- `package.json` has a `files` allowlist (`dist`, `tailwind.preset.js`,
  `tailwind.css`, `styles.css`, `styles`), so this file, `HANDOFF.md`, and
  `skills/` are **not** published to npm.

## Doc drift — trust the repo, not the doc

- Reconciled 2026-10-06. The bullets previously here (commit identity, a WSL
  absolute path in SKILL.md, a "not yet fixed" Slider row, a malformed
  SKILL.md region, and an empty `src/components/textArea/`) were all stale
  and have been removed.
- The rule stands: when a doc and the repo disagree, the repo wins — and the
  fix is to correct the doc, not to work around it.
