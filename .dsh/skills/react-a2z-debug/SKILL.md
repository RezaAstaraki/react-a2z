---
name: react-a2z-debug
description: Use when a library build, token check, or export looks wrong or looks fine but should not -- a triage table of which check is lying and what the real gate is.
---

# Debugging a library symptom (react-a2z)

## When this applies
Something is wrong, or looks right and should not. This is NOT an edit
protocol -- to add or change a component load `react-a2z-library-edit`.

## The one rule
Every cheap check here can pass VACUOUSLY: green on the ABSENCE of the
thing it checks.
- `verify-tokens` scans `.tsx` only -- a component whose styling lives
  in a `.css` file is invisible to it.
- A wrong token mapping RENDERS FINE; raw palette classes look correct.
- `rollup` can print every "created" line and then never exit.
When a check disagrees with the source, the SOURCE wins.

## Triage -- symptom | the check that lies | the real gate
- `npm run rollup` "hangs" after printing `created` | the exit code
  (124 under timeout) | `ls -la dist/index.d.ts` mtime -- the build
  SUCCEEDED; do NOT poll, kill the job.
- `verify-tokens` green but a component unthemed | it only scans `.tsx` |
  browser check; the file may be CSS (PearlButton).
- Renders, but the wrong colour/radius | it renders "fine" | browser
  check -- the only guard against a bad token mapping.
- `import { X } from "react-a2z/Y"` runs, will not typecheck | runtime is
  fine | symbol present in `src/components/index.ts` (value + type, split)
  AND in `rollup.config.js` `entries` if it is a barrel subpath.
- A `package.json#exports` subpath 404s at runtime | nothing -- no check |
  the exports-resolve node one-liner in `AGENTS.md` (no output = OK).
- `dist/index.d.ts` missing a name | nothing | `grep -E` it, per AGENTS.md.
- JSDoc row blank in the guide's table | docgen reads source | the JSDoc
  lives on the PROP, not the type alias.
- A rename silently dropped a guarded file | `MIGRATED` has `existsSync` |
  run `npm run rollup` AND `node scripts/verify-tokens.mjs`.

## Stop conditions -- halt and ask
- Symptom not in the table -> ask; do not guess a fix.
- The fix would change a shipped API -> record it in `ROADMAP.md`; do
  NOT fix it unilaterally.
- A destructive command already ran once -> do NOT re-run it. Confirm
  state first. Line-addressed deletes are NOT idempotent, and an
  unconditional `cp file file.bak` destroys the undo.
- The symptom is in the consumer app, not the library -> different repo,
  different skill; say so.

## Canonical skills -- do not duplicate
- Library component edits:
  `.dsh/skills/react-a2z-library-edit/SKILL.md`
- Guide page/example edits (other repo):
  `../test-app-for-lib/.dsh/skills/react-a2z-guide-page/SKILL.md`
