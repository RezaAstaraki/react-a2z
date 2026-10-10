# AGENTS.md - react-a2z

This is the React component library. Its sibling consumer is ../test-app-for-lib,
linked through file:../react-a2z. Commands assume this repo root.

## Route the task first

For DSH, load the matching skill before task-specific reads or edits:
- Add/change a component, hook or utility: react-a2z-library-edit.
- Investigate a broken or misleading result: react-a2z-debug.

Entrypoints: .dsh/skills/<name>/SKILL.md.
For agents without DSH's skill tool, read that file directly.
Read only relevant sections of LIBRARY-REFERENCE.md for API, house style,
tokens and exports. Actual source wins when documentation disagrees.
Consult relevant ROADMAP.md items; the user's explicit task takes priority.

## Keep context focused

DSH workers do not load SMART-WORKER-LIBRARY.md, manager notebooks or docs/history/
by default. Those are for web chat and session evidence, not worker startup.
Local environment notes are in ../test-app-for-lib/.dsh/lead/ENVIRONMENT.md.
Do not hard-code another machine's username or change runtime profiles during
an ordinary component task.

## Editing

Preserve CRLF/LF; avoid blind line-addressed sed edits.
Back up before overwriting without replacing an older backup.
Stage intended files explicitly if committing; never git add .
Use git --no-pager. Keep backup files out of commits.
Read and edit directly when file tools are available; the web-chat command-relay
protocol in SMART-WORKER-LIBRARY.md sections 2-3 does not apply.

## Build and verify

Build: npm run rollup. Watch: npm run dev.
After a change:
- Check build diagnostics, including component TS2322/TS2345 errors.
- Confirm affected public values and types appear in dist/index.d.ts.
- Confirm package.json exports resolve to emitted files, including barrel entries.
- Run node scripts/verify-tokens.mjs for token changes and
  node scripts/verify-color.mjs for colour-primitive changes.

Exports check (from repo root):
    node -e "const p=require('./package.json'),fs=require('fs'); for (const [k,v] of Object.entries(p.exports)) { if (typeof v!=='object') continue; if (!fs.existsSync(v.import)) console.log('MISSING', k, v.import); }"

No output means the checked import paths exist, provided the command ran successfully.
For a barrel subpath, its index.ts must be an explicit entry in rollup.config.js.
A library change reaches the guide after rebuilding dist and hard-refreshing its browser.
Save full build logs and return bounded excerpts. A timeout or environment failure is not
proof that validation passed; check emitted artifacts and remaining gates.
Report each required check as passed, failed or blocked.
