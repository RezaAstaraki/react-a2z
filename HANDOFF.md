# HANDOFF — How to work with me on this project

Paste/attach this file at the start of any new chat session so the assistant
has the full context. Keep it up to date when our working rules change.

Canonical library doc: `skills/web/react-a2z/SKILL.md` (in repo, committed).
That file is the source of truth for the library API, house style, pitfalls,
build pipeline, and the shell-gotcha table. THIS file is the source of truth
for how we *interact* and how to start / verify a session.

**The next task lives in `ROADMAP.md`** — the live work list (migration
progress, open API questions, publish prep). Read it before starting so you
pick up the intended work instead of inventing it. Edit it in place as work
lands.

**`AGENTS.md` holds agent-facing rules** — CRLF handling, the
build-and-verify checklist, the `external` requirement in `rollup.config.js`,
and the package.json#exports subpath rules. Read it too.

> **Precedence note.** §2 and §3 below describe a workflow for an assistant
> with **no filesystem access** — one command at a time, edits delivered as
> `cat > file <<'EOF'` heredocs, the human running everything. If you have
> direct file tools, those sections do not describe your job: read and edit
> files yourself. `AGENTS.md` takes precedence over §2/§3. The *technical*
> constraints inside them still bind — CRLF-aware edits, back up before
> overwriting, `git add <file>` never `git add .`, `git --no-pager`.

---

## 1. Environment

- OS / shell: WSL (Ubuntu) on Windows — bash, not PowerShell.
- I always launch WSL from the project root, so cwd is already the repo
  root. Never include absolute paths in commands.
- Editor (VS Code) may write CRLF. `.gitattributes` has `* text=auto` —
  blobs are LF, worktree may be CRLF. Do NOT try to normalize the worktree.
- Push uses a classic PAT (`repo` scope) over HTTPS.
- Stack: React 18+, TypeScript 5+, Tailwind CSS 3.4+ / v4, Rollup with
  `preserveModules: true`. Published as `react-a2z`. Full library
  surface, house style, and pitfalls live in SKILL.md.

### Remote / resume

- Remote: `origin` → `https://github.com/RezaAstaraki/react-a2z.git`
  (fetch + push). Branch `main`, tracking `origin/main`. This is the only
  remote.
- Auth: classic PAT (`repo` scope) over HTTPS. `credential.helper` is
  already `manager` in this repo, so the PAT is picked up automatically.
- Last synced state (2026-10-06): HEAD `373aaa2` on `main`, level with
  `origin/main` (0 ahead / 0 behind).
- To resume on another machine:

      git clone https://github.com/RezaAstaraki/react-a2z.git
      cd react-a2z && npm install
      npm run rollup

- The consumer app is a *separate* repo
  (`https://github.com/RezaAstaraki/test-app-for-lib.git`) that depends on
  this one as `file:../react-a2z`. On a fresh machine clone BOTH repos as
  siblings with those exact directory names, or the dependency breaks
  silently.
- Never copy `node_modules` between machines — this one is a Windows
  install carrying win32 native binaries (`lightningcss`,
  `@tailwindcss/oxide`). Always `npm install` on the target platform.

I run every command myself in WSL and paste the output back to you.
I cannot run PowerShell here, and I cannot run commands outside the
project root unless you say otherwise.

---

## 2. How I want you to communicate

These are hard rules. Follow them every response.

1. One command at a time. Never bundle multiple shell commands in one
   reply expecting me to run them in sequence. Give me exactly one
   command, then stop and wait for my output.
2. Wait for output. Do not guess what the command will return. Do not
   proceed to the next step until I paste the result.
3. No invented file contents. If you need to see a file, ask me to
   cat it. Never assume its contents.
4. Explain before code. A one-paragraph "why" before any code block,
   so I can sanity-check the plan.
5. Minimal diffs. Prefer the smallest change that fixes the problem.
   Don't refactor unrelated code unless I ask.
6. Reversible edits. When rewriting a file, back it up first
   (cp file file.bak) and print a short verification (e.g. tail -n 20).
7. Copy-paste ready. Every code block should be runnable as-is.
8. Markdown output. Use fenced code blocks with a language tag.
9. When in doubt, ask. A clarifying question is cheaper than a wrong edit.

**Clipboard convention (chat mode).** Pipe output through `tee` so it reaches
both the screen and my clipboard:

    <cmd> 2>&1 | tee >(clip.exe)

Plain `<cmd> | clip.exe` hides stdout: the screen stays empty and a failure
looks like a success. (`git`/`npm` write to stderr and stay visible; `node`
scripts write to stdout and vanish.) Group multi-command output as
`{ a; b; } 2>&1 | tee >(clip.exe)` — a `;`-chain pipes only the LAST command.
Never pipe a heredoc *write*; the `>` redirect swallows stdout, so pipe the
verification instead. `$?` after a pipe reports `clip.exe`, not the command:
check `${PIPESTATUS[0]}`, or `set -o pipefail`. Long jobs (build, push):
append `& wait`. An empty paste means interop is off — fall back to `cat`.
Chat mode only: an agent with file tools reads files directly (see the
precedence note above).

---

## 3. How I want you to give me file changes

10. NEVER tell me to open an editor and paste code in. Every file creation
    or edit must be delivered as a bash command I can run in WSL.
11. Use `cat > file <<'EOF'` for new files and `cat >> file <<'EOF'` for
    appends. Single-quoted EOF so bash does not expand `$`, backticks, etc.
12. Keep each heredoc under ~50 lines. Long pastes get truncated by my
    terminal (we hit this). Split into multiple commands if needed, one
    command per reply, and wait for my confirmation after each.
13. Always back up before overwriting: `cp file file.bak`.
    NOTE: this repo's `.gitignore` does NOT cover `*.bak` (unlike my other
    projects). Delete backups with `rm` when done, don't leave them to show
    up in `git status`.
14. End each write command with a short verification, e.g.
    `wc -l file && tail -n 5 file`.
15. Never assume a previous command succeeded. Ask me to run
    `wc -l file && tail -n 3 file` and wait for the output.
16. For CRLF-sensitive edits (in-place `sed`, anchored patterns) prefer
    a `cat > file <<'EOF'` rewrite or a script written to `/tmp/*.js` and
    run with `node /tmp/x.js` — see the shell-gotcha table in SKILL.md.

---

## 4. Shell gotchas (pointer)

The full trap table lives in SKILL.md → "Shell gotchas (all have burned us)".
Highlights, because they've cost us real time:

- Worktree may be CRLF → `sed -i '/foo$/a bar'` can silently no-op.
  Prefer a full `cat > file <<'EOF'` rewrite or a `/tmp/*.js` node script.
- `node -e '...'` breaks when the JS contains `'`. Write to `/tmp/x.js`
  via heredoc, then `node /tmp/x.js`.
- Bare `!` in bash triggers history expansion. Keep it in a script, or
  use `[ -f x ]` style tests.
- `find` / `git diff` can open a pager. Use `git --no-pager <cmd>` or
  pipe to `cat`.
- After editor writes, bulk `git status` noise is almost always CRLF churn.
  Confirm with `git --no-pager diff --ignore-cr-at-eol --name-only`.

---

## 5. Build + verify quick reference

Build: `npm run rollup`
Verifiers (no npm alias -- run by path):

    node scripts/verify-tokens.mjs   # token-layer harness + migration progress
    node scripts/verify-color.mjs    # colour-primitive assertions (24)
Watch: `npm run dev`

After a build, verify:

1. No `TS2322` / `TS2345` from `src/components/**`.
2. `dist/index.d.ts` contains all component + type names:
   `grep -E "Slider|ColorPicker|GradientMaker" dist/index.d.ts`
3. Every `package.json#exports` subpath resolves to an emitted file:
   `node -e "const p=require('./package.json'),fs=require('fs'); for (const [k,v] of Object.entries(p.exports)) { if (typeof v!=='object') continue; if (!fs.existsSync(v.import)) console.log('MISSING', k, v.import); }"`
   No output = all subpaths resolve.
4. Barrels (`./Modal`, `./Toast`, `./ColorPicker`, `./Md`, `./MdEditor`,
   `./Counter`, `./hooks`) are emitted because they are listed as explicit
   entry points in `rollup.config.js` (`entries`). If a subpath regresses,
   check that its `src/.../X/index.ts` is still in that array. See
   SKILL.md → "package.json exports — subpath rules".
5. Client/server boundary — do **not** add `"use client"` unless the component
   needs hooks, state, browser APIs, or a portal. `Button`, `Input`,
   `PearlButton` and `Md` are hook-free Server Components; `Slider`, `Tooltip`,
   `ColorPicker`, `Counter`, `MdEditor`, `ClientLogger`, `Modal` and `Toast` are
   client components. A *missing* directive fails the Next build loudly, but an
   *unnecessary* one fails nothing at all — so check this by eye whenever you
   add a component. See SKILL.md → "House Style" rule 4.

Consumer note: the test app (`../test-app-for-lib`) loads this package
through a `node_modules` symlink. After `npm run rollup`, **hard-refresh
the browser** (`Ctrl+Shift+R`) — HMR does not reliably pick up changes
that flow through the symlink.

---

## 6. Project layout cheatsheet

- `src/components/<Name>/` — one folder per component: `<Name>.tsx` + `index.ts`.
- `src/hooks/` — reusable hooks.
- `src/utils/` — `cn`, `createCn`, `createRecipe`, `mergeRefs`, `color.ts`
  (hex/HSL/luminance primitives), digit converters, form helpers.
- `src/index.ts` — top barrel. `src/components/index.ts` — component barrel.
- `styles/` — non-utility CSS (currently only `pearl-button.css`).
- `tokens.css` — design tokens, the single source of colour/radius/shadow
  values. `tailwind.preset.js` maps them for v3; the `@theme inline` block in
  `tailwind.css` maps them for v4. `components.css` holds prebuilt CSS.
- `tailwind.css`, `tailwind.preset.js`, `tailwind.config.js` — Tailwind wiring.
- `scripts/verify-tokens.mjs` — token-layer harness (also reports migration
  progress). `scripts/verify-color.mjs` — colour primitive assertions.
- `ROADMAP.md` — the live work list (see preamble).
- `rollup.config.js` — `preserveModules: true`, `preserveModulesRoot: 'src'`,
  `terser({ compress: { directives: false } })`, `preserveDirectives()`
  plugin re-adds `"use client"` / `"use server"`.
- `skills/web/react-a2z/SKILL.md` — canonical library doc (see top of file).
- `AGENTS.md` — agent-facing repo rules (see preamble).

---

## 7. Git / commit hygiene

- Identity: `RezaAstaraki <reza.astaraky@gmail.com>`.
- Stage only intended files: `git add <file>`. Never `git add .`.
- This repo has no husky / lint-staged, so `git commit` is fine in WSL.
  (My other project, eshop2, has hooks — those commits must happen in
  PowerShell. Not applicable here.)
- Use `git --no-pager log` / `git --no-pager diff` to avoid the pager.
- If `git status` suddenly shows many files after an editor save, check
  for CRLF churn first: `git --no-pager diff --ignore-cr-at-eol --name-only`.
- Commit message style: scoped conventional commits — `type(scope): summary`,
  lowercase imperative. Read `git --no-pager log --oneline -10` for the
  current shape; do not copy examples from old commits or this file.

---

## 8. Session start checklist

When I paste this file at the start of a session, please:

1. Acknowledge you have read the rules in sections 2 and 3.
2. Read `ROADMAP.md`, then open by proposing its next unchecked item —
   do not ask "what are we working on" blind.
3. If I mention a file, ask me to `cat` it — never assume.
4. Apply rule 1 (one command at a time) from the very first reply.
5. If the task touches library API / house style / pitfalls, read
   `skills/web/react-a2z/SKILL.md` and `AGENTS.md` first and mirror their
   conventions.

---

## 9. Session log

- 2026-10-05: Created this HANDOFF.md. Decision recorded: SKILL.md stays
  the canonical library doc (API, house style, pitfalls, build); HANDOFF.md
  covers interaction rules + session workflow and *references* SKILL.md
  rather than duplicating it. Noted for next time:

  - This repo's `.gitignore` does NOT ignore `*.bak` (unlike eshop2).
    DECISION: leave it that way. Backups should stay visible in `git status`
    as a reminder and be deleted (`rm`) before each commit. Do not add
    `*.bak` to `.gitignore`.
  - SKILL.md's environment line names a different repo path than my actual
    WSL path. HANDOFF.md avoids naming absolute paths for this reason:
    "cwd is the repo root" is the durable phrasing.
  - No husky / lint-staged here, so WSL `git commit` is fine. Do not copy
    eshop2's "commit in PowerShell" rule into this repo.

- 2026-10-06: Added the "Remote / resume" subsection to §1 (origin URL, branch,
  PAT auth, last synced HEAD, clone-and-rebuild steps for another machine).
  Also appended this client/server boundary rule as verify step 5 in §5.

  - DECISION: `"use client"` is applied only when a component genuinely needs
    hooks, state, browser APIs, or a portal — never blanket-applied.
    `Button`, `Input`, `PearlButton` and `Md` are hook-free Server Components;
    `Slider`, `Tooltip`, `ColorPicker`, `Counter`, `MdEditor`, `ClientLogger`,
    `Modal` and `Toast` are client components.
  - WHY IT NEEDS WRITING DOWN: the two mistakes are not symmetric. A *missing*
    directive fails the Next build with an explicit error ("importing a module
    that depends on `useState` into a React Server Component module"). An
    *unnecessary* one fails nothing — no lint, no type error, no test — it just
    silently pushes that component and its subtree into the client bundle. So
    the only guard against over-applying it is knowing the rule.
  - Recorded in SKILL.md (Overview "Interop" + House Style rule 4), README.md,
    and a why-comment at the top of each server-safe component so the reason
    travels with the code.

- 2026-10-06 (later): Two library additions.

  - **`CodeBox`** (`src/components/CodeBox/`) — read-only code block that reuses
    `highlightCode()` from `Md` (no second tokenizer), plus a new public
    `copyToClipboard` util in `src/utils/`. `CodeBox.tsx` is hook-free
    (server-safe); only the internal `CodeBoxCopyButton` carries `"use client"`.
    Known limitation: the syntax token colours are baked into `highlightCode`,
    so they are NOT reachable through `classNames` — CodeBox is dark-only until
    the palette moves to CSS variables.

  - **Modal `placement` is now a logical 3x3 grid** — six new values:
    `top-start`, `top-end`, `center-start`, `center-end`, `bottom-start`,
    `bottom-end`. `auto` / `top` / `bottom` remain aliases of the centre column
    (kept for compatibility, not dead values).

    ```tsx
    <CustomModal isOpen={open} onClose={close} placement="top-start" title="Top start" />

    // zIndex is NOT in the setModalOpen payload — the store computes stacking.
    setModalOpen({ modalTitle: "Settings", placement: "bottom-end", size: "md" });
    ```

  - DECISION: `start` / `end` are **logical**, not physical. There is no
    CSS-only way to pin a physical left in RTL — `justify-start` follows the
    writing direction — so `top-start` is top-left in LTR and top-right in RTL.
    Naming them `left` / `right` would make the API lie in RTL.
  - Implementation is unchanged: placement is still just flex `items-*` /
    `justify-*` on the fixed wrapper, so no layout behaviour moved and the six
    new combos are purely additive.
  - Also recorded in SKILL.md: the full Modal prop list, the `zIndex` exclusion
    from `setModalOpen`, and the known dead surface (`modalIconColor`,
    `modalTitleColor`, `modalBorderColor`, `modalBgIcon`, `modalIconName`,
    `modalDescription`, `stackable`).

- 2026-10-06 (session 3): Finished the token layer and proved it end to end.

  **The v4 gap.** The token layer existed but only worked for v3.
  `tailwind.preset.js` mapped every `--a2z-*` variable onto a Tailwind name,
  but nothing did the equivalent for v4 — `tokens.css` declared the variables
  and `tailwind.css` only set `@source`, which tells v4 where to scan for
  class names without *generating* anything. So v4 consumers got the
  variables and none of the utilities: `bg-primary-600`, `rounded-md` etc.
  compiled to nothing and the migrated Button/Input rendered unstyled.
  Fixed with a `@theme inline` block in `tailwind.css`.

  - DECISION: `inline`, not plain `@theme`. Plain `@theme` would emit a
    second `--color-primary-600` variable for utilities to reference, giving
    two names for one knob. `inline` bakes the `var(--a2z-*)` reference
    straight into the utility, so `--a2z-*` stays the only override path.
  - Verified in the browser: overriding `--a2z-primary-600` on a wrapper
    re-hues both the solid button and its derived `-soft` wash, with no
    rebuild.

  **The build bug.** `peerDepsExternal()` only externalizes
  `peerDependencies`. `clsx` and `tailwind-merge` are regular deps, so
  Rollup bundled them into `dist/esm/node_modules/...` and rewrote the
  import to a relative path. Node then parsed that copy as CJS and the named
  `twMerge` export failed at load — every consumer import would have crashed.
  Fixed with an explicit `external: ['clsx', 'tailwind-merge']`.

  - Caught by `scripts/verify-tokens.mjs`, not by the build. The build was
    green the whole time. This is the argument for keeping the harness.

  **The demo migrations.** Both `ButtonDemo` and `InputDemo` were on the
  pre-token API. Button used `variant="filled-blue"` (no longer a variant);
  Input used `variant="default|focused|error"` (no longer a prop at all).

  - WHY IT DID NOT FAIL: React 19 passes unknown props through to the DOM as
    no-ops, and `next dev` does not type-check. The dev server returned 200
    while five "different" input states rendered identically. Only
    `next build`, or grepping the built `d.ts`, would have caught it.
  - Both demos rewritten against the real APIs and verified in the browser.

  **Doc reconciliation.** SKILL.md, README.md, `tailwind.preset.js`'s header
  and `AGENTS.md` all predated the token work.

  - SKILL.md: Button/Input API sections, House Style rules 5/6/8/12,
    Utilities, Styling Model, Build, Design Principles, When Extending, the
    Verification Checklist, plus a new "Design tokens" section and three new
    pitfall rows.
  - README.md: usage example fixed, new Theming section.
  - `AGENTS.md` "Doc drift": all five bullets were stale, and stale in the
    dangerous direction — they told agents to distrust docs that are now
    correct. Replaced with the standing rule rather than a fresh list of
    claims that will rot the same way.

  Pushed: `react-a2z` `e29db55..ca0b47c`, `test-app-for-lib`
  `fbfdbe2..d76faab`.

  - NOTE: `955e65c "in middle i continued"` carries the whole token layer and
    was pushed with that subject. Left alone deliberately — rewording a
    non-tip commit means an interactive rebase 6 deep, which is more risk
    than a bad subject line is worth.

- 2026-10-07 (session 3, continued): ColorPicker + GradientMaker migrated,
  colour primitives added, both roadmaps created. 5 of 14 components done.

  **`src/utils/color.ts`.** Shared hex/HSL primitives, because ColorPicker was
  doing ad-hoc string comparison inline and GradientMaker was doing none.
  24 assertions in `scripts/verify-color.mjs`. One is pinned deliberately:
  `normalizeHex('bad')` returns `#bbaadd` — b, a and d are all hex digits,
  so "bad" is valid 3-digit shorthand. Looks like a bug, is not. Accepting a
  missing `#` is the deliberate trade (users paste `ff0000` without one); the
  cost is that some English words are valid colours.

  **GradientMaker decisions.**

  - DECISION: the pan animation is REMOVED. Eleven infinite animations on one
    page, all repainting background-position, and the preset swatches moved
    while you were trying to read them. Decoration that cannot be turned off
    does not belong in a component. Consumers can add it back in 3 lines.
  - DECISION: the built-in gradient presets stay PRIVATE. `presets` replaces
    them, it does not extend. Upside: retuning a built-in colour later is not
    a breaking change. Do not export them.
  - DECISION: the active preset is DERIVED from the current stops, not stored.
    Edit a colour and every preset deselects — the honest state, since no
    preset matches any more. Storing the last-clicked name would keep a ring
    on a preset the gradient no longer corresponds to.
  - DECISION: persistence ("remember the user's last colours") was considered
    and REJECTED as an app-level concern, not a library one. It is opt-in and
    writes nothing by default, but the six edge cases (key collisions, SSR
    flash, corrupt data, localStorage throwing, controlled mode, write
    frequency during a slider drag) all belong to the app. Do not re-propose
    it for these components.

  **`--radius` was missing from the v4 `@theme` block.** Bare `rounded` fell
  back to Tailwind's built-in 0.25rem while the token layer says 0.5rem, so
  any component writing bare `rounded` rendered at half the intended radius.
  Only ColorPicker did, and it was invisible by eye — which is exactly how it
  survived review. Added `--radius: var(--a2z-radius)`.

  **Open, recorded in ROADMAP.md:** GradientMaker is uncontrolled-only and
  always renders the copy row, while ColorPicker has `value` / `defaultValue` /
  `show*` flags. Proposed but NOT implemented: `showCopy`, `defaultValue`,
  `defaultAngle`. A fully controlled `value` needs a `{ colors, angle }`
  shape, so it is a bigger question.

- 2026-10-07 (guide session): a guide-side find produced a library question.

  - A `loading` Button greys out regardless of `color`, because loading sets
    `isDisabled = disabled || loading`, so the disabled styles win. Found
    while building the guide: `<Button loading color="success">` renders
    grey, not green.
  - Recorded in `ROADMAP.md` §5 as a 2.0.0 decision, both options stated.
    Note only -- no code change, because it is a design call on a shipped
    component, not a bug to fix unilaterally.
  - Also added the same caveat to `SKILL.md`'s Button section, since
    SKILL.md is canonical and a consumer reading it would not expect this.

- 2026-10-08 (guide session 6): Tooltip JSDoc pass + CssTooltip decision.

  - 11 prop-level JSDoc lines added to `TooltipProps` (open, defaultOpen,
    onOpenChange, placement, disabled, showArrow, className, classNames,
    style, styles, children). Coverage 5/16 -> 16/16. Commit `697335b`.
    Two corrections landed in the same pass: `className` is merged AFTER
    `classNames.root` (so className wins), and `style` AFTER `styles.root`
    (so style wins) -- the source order is the source of truth.
  - `CssTooltip` DECIDED as a new export, NOT a replacement. Library
    ROADMAP section 7 has the shape and five open questions. The
    interactive Tooltip stays a Client component -- same call HeroUI,
    Radix, shadcn and MUI all make (HeroUI only hides the boundary by
    injecting the directive at build time).
  - SKILL.md updated in three places: two SSR / container bullets in the
    Tooltip section, one on `display: contents` for the root span, and two
    pitfall-table rows (forced-open hydration, transform containing block).
  - The existing pitfall row "Tooltip content silently missing on first
    render because `container` is `null`" is a DIFFERENT failure from the
    hydration one: that row is the component's internal no-DOM guard; ours
    is a consumer forcing `open` on first paint, which the guard cannot
    cover. Both rows now exist and must stay separate.
  - No component code changed. No migration. Token count stays 6 of 14.
