# ROADMAP — react-a2z

Living work list. Edit in place, check items off, delete what is done. This file
is NOT published (`package.json#files` excludes it) — it is internal coordination.

Companion docs: `SKILL.md` (library API + house style), `AGENTS.md` (repo rules),
`SMART-WORKER-LIBRARY.md` (session protocol + log of what happened).

## Where things stand (updated 2026-10-08)

- The token layer is done and proven: `tokens.css` is the single source of
  values, mapped for v3 by `tailwind.preset.js` and for v4 by the
  `@theme inline` block in `tailwind.css`.
- **6 of 14 components are migrated**: `Button`, `Input`, `Slider`,
  `ColorPicker`, `GradientMaker`, `Modal`.
- **6 still emit raw palette classes**: `Toast`, `Tooltip`, `Md`,
  `MdEditor`, `CodeBox`, `ClientLogger`. (The verifier counts these as 8
  *files* — `Md` and `CodeBox` each have a second file with palette classes.)
- `Counter` is clean and now guarded in `MIGRATED`. `PearlButton`'s `.tsx` is
  clean, but its styling lives in `styles/pearl-button.css`, which the harness
  cannot scan. See the note in section 1.
- Slider also dropped its private `useControllableState` / `mergeRefs`
  copies; those shared utils now have no remaining private duplicates.
- **`displayName` coverage is complete.** All 18 `forwardRef` call sites set
  it, and the compound components use dotted names (`Slider.Label`,
  `Tooltip.Trigger`), so DevTools shows a real tree. Verified 2026-10-07 --
  do not re-investigate. The remaining components (`Md`, `CustomModal`,
  `GlobalToast`, ...) are named `function` declarations, which JS names
  automatically.

## 1. Invert the verifier — DONE (f5ea5f2)

The raw-palette assertion used to hardcode `Button.tsx` and `Input.tsx`, so it
guarded only the finished work and would report "All checks passed" while
anything else regressed.

- [x] `MIGRATED` array + disk scan; unmigrated files report as pending.
- [x] `from|to|via` added to the regex (gradient utilities were invisible).
- [x] `existsSync` per MIGRATED entry, so a rename cannot drop it silently.

Still to do: add each component to `MIGRATED` in the same commit as its
migration.

**Known gap — the verifier only scans `.tsx`.** `PearlButton`'s styling lives
in `styles/pearl-button.css`, so the harness cannot see it: if it regresses
the harness stays green. Same class of bug this section was written to fix —
the net guarding the wrong thing.

To be accurate about that file: it is **variable-driven**, not migrated to the
core token layer. Every value goes through a `--a2z-pearl-*` variable, so it is
fully overridable, but the variables hold pearl-specific literals rather than
referencing `--a2z-*`. Its translucent overlays (`rgb(255 255 255 / 0.3)` etc.)
are gloss/sheen effects, not palette colours — there is nothing to migrate
them to, and they should stay literals.

Open question: should `--a2z-pearl-bg: #080808` reference a core token? It is a
deliberate near-black for a glossy dark button, and the nearest core value
(`--a2z-neutral-900`, 17 24 39) is a different colour. A design call, not a
bug. Do not "fix" it without deciding.

RESOLVED (2026-10-07): the harness now **reports** the files it cannot scan
rather than attempting a CSS palette check. A CSS scan would flag the gloss
and sheen values, which have nothing to migrate to, so it would need enough
exceptions to become noise. Reporting the gap is honest; a scan that cries
wolf is not. See `scripts/verify-tokens.mjs`.

**Why it came first:** it was a contained change to one script and it made
every migration below safe. The net used to protect the finished work and
ignore the in-progress work — backwards.

## 2. Migrate the remaining components

One component at a time. Each: bake token classes, remove its exemption entry,
and **verify in `test-app-for-lib`** (hard refresh after `npm run rollup`).

Each pass ALSO adds prop-level JSDoc to that component's `XProps` (House
Style rule 13). The guide generates its prop tables from this source, so a
migration without docs ships a table with blank rows. Button is the
template -- do it there first, then carry the shape forward.

- [x] `Modal`
- [ ] `Toast`
- [ ] `Tooltip`
- [x] `Slider`
- [x] `ColorPicker`
- [x] `GradientMaker`
- [ ] `Md`
- [ ] `MdEditor`
- [ ] `CodeBox` (blocked on step 3)
- [ ] `ClientLogger`

**Slot coverage is partial.** GradientMaker ships eleven `classNames` /
`styles` slots; the demo exercises **three**: `preset` (via both
`classNames.preset` and `styles.preset`), `preview` and `copyButton`. Still
unexercised: `root`, `label`, `presets`, `customColors`, `swatch`, `angle`,
`copyRow`, `copyInput`.

**Open API question (discussed, not implemented).** GradientMaker is
uncontrolled-only and always renders the copy row, while ColorPicker has
`value` / `defaultValue` and `show*` flags. Proposed, matching ColorPicker:

- `showCopy?: boolean` — hides the whole copy row
- `defaultValue?: string[]` — seed the stops
- `defaultAngle?: number` — seed the angle

A fully controlled `value` is a larger question: the gradient is two pieces
of state (colours + angle), so it would need a `{ colors, angle }` shape.

**Order:** most-used first (Toast, Tooltip); CodeBox is blocked on step 3.
**Warning:** a wrong token mapping fails SILENTLY. Raw palette classes render
fine, so nothing fails loudly — the browser check is the only real guard.

## 3. Syntax palette to CSS variables (unblocks CodeBox + Md)

`highlightCode()` in `src/components/Md/` bakes syntax colours as literal
`text-sky-300` / `text-emerald-300` / `text-amber-300` / `text-gray-400`
classes, so CodeBox cannot be re-themed through `classNames`.

- [ ] Introduce `--a2z-syntax-*` variables in `tokens.css`.
- [ ] Map them in `tailwind.preset.js` (v3) and the `@theme inline` block (v4).
- [ ] Rewrite `highlightCode()` to emit them.
- [ ] Then migrate `CodeBox` and `Md`.

This is a real refactor, not a find-and-replace.

## 4. Prove global theming (untested)

Only a PER-INSTANCE override has been verified (the Button demo). Untested:

- [ ] `.a2z-dark` / `.dark` actually flips the whole UI.
- [ ] A global `:root` override re-themes every migrated component at once.

- [ ] Add a theme-switcher demo in `test-app-for-lib` that toggles both.

This is the headline README promise; it deserves a real test, not trust.

## 5. Publish prep

- [ ] **Major version bump.** The Button API changed incompatibly
      (`variant="filled-blue"` -> `solid` / `soft` / `outline` / `ghost` /
      `link`). Package is at 1.0.0; this needs 2.0.0.
- [ ] Add a CHANGELOG and a migration note for the Button variant rename.
- [ ] Track the five deprecations promised "for one major": `buttonType`,
      `errorMessage`, `inputClassName`, `labelClassName`, `readonly`.
      Remove them when 2.0.0 lands, or restate the promise.
- [ ] **Decide the loading/color behaviour.** A Button with `loading` sets
      `isDisabled = disabled || loading`, so the disabled styles win and the
      `color` prop has no visible effect while loading. Found via the guide:
      `<Button loading color="success" text="Saving" />` renders grey, not
      green. Two options, both defensible:
      (a) keep greying out -- loading IS disabled, so this is consistent;
      (b) keep the color while loading, greying out only on real `disabled`.
      Currently (a) with no note in the source, so a consumer sees a bug.
      If (a) wins, document it; if (b), it is a 2.0.0 behaviour change.
- [ ] **Three CustomModal prop problems.** Found via the guide while
      documenting the modal page. They are NOT all the same kind:
      (a) is a misfiled prop, (b) and (c) are genuine duplicates.
      (a) `stackable` is MISFILED, not broken. Its purpose is nested
          modals: when true, the next modal stacks on top instead of
          replacing the current one. But only the STORE reads it --
          `setModalOpen` does `shouldStack = Boolean(top?.stackable)`.
          `CustomModal` never destructures it, so a direct consumer
          passing it gets nothing. The prop is declared on
          `CustomModalProps`, where it is inert, when it belongs only on
          `SetModalOpenPayload`. Fix: move it off the component props
          type. The component-side JSDoc STAYS as written -- on THAT
          table, "no effect in CustomModal" is the honest and useful
          thing to say. 2.0.0 (removing a prop is breaking).
      (b) `isDraggable` and `headerDraggable` are the SAME switch --
          `canDrag = Boolean(headerDraggable || isDraggable)`, and the
          pointer handler is only ever attached to the header. Two names,
          one behaviour; `GlobalModal` even aliases them. Fix: keep one,
          deprecate the other. 2.0.0.
      (c) `className` and `contentClassName` both land on the PANEL, in
          that order. The name suggests `contentClassName` styles the body,
          but that is `bodyClassName`. Fix: rename, or drop one. 2.0.0.
- [ ] **Counter's `onStart` / `onEnd` are identity-sensitive.** Found while
      building the guide's Counter page: passing an inline arrow
      (`onStart={() => ...}`) creates a new function every render, which
      changes the identity of the internal `run` useCallback, which
      re-fires the `useEffect([run, target])` that starts the animation,
      which calls `onStart()`, which `setState`s, which re-renders -- an
      infinite update loop (`Maximum update depth exceeded`).
      Two options:
      (a) document only -- the consumer's job to memoize callbacks. The
          guide example now does this and the comment explains why.
      (b) hold `onStart` / `onEnd` in refs inside Counter, so `run`
          depends on nothing the consumer can change per render. This is
          the standard fix and makes inline arrows Just Work.
      (b) is a behaviour change with no API change -- arguably a bug
      fix, not a 2.0.0 item. Decide which way; if (b), it is safe to
      ship in the next patch and does not need a migration note.
      Cross-cutting: `classNames` / `styles` merge order is consistent
      across components by COINCIDENCE, not by a stated rule. Worth writing
      down (root-last? per-slot?) before the surface grows further.

- [ ] **ClientLogger duplicates its prop type.** Found while building the
      guide's client-logger page. `Wrapper.tsx` declares a named
      `ClientLoggerProps` and is the file the barrel re-exports, so it
      is the public surface -- and it is what docgen reads. But
      `ClientLogger.tsx` declares the SAME five props again, inline on
      its default export. Byte-identical today, so nothing has broken;
      the risk is drift. Edit one and forget the other and the guide's
      prop table silently disagrees with the rendered component -- the
      section 3 code-string class, one level up. Fix: delete one
      definition. Smaller diff is to drop the inline literal from
      `ClientLogger.tsx` and import the type from `Wrapper`. Type-only,
      so no runtime change and no migration note.
- [ ] **`showDataConsole` does not print on mount.** Found via the guide.
      The prop only sets the checkbox's INITIAL state; the `console.log`
      fires in the checkbox's `onChange`, so
      `<ClientLogger data={x} showDataConsole />` renders with the box
      checked and logs nothing until the reader toggles it. Two options:
      (a) document -- the prop is "start checked", not "log now", and
      the JSDoc now says exactly that;
      (b) also `console.log` in a mount effect when the prop is true, so
      the name matches the behaviour.
      (b) is a behaviour change with no API change. Decide which way.

## 6. Test infrastructure — start before the next migration

The verifier (`scripts/verify-tokens.mjs`) and the consumer app's
`verify-css.mjs` are **static** checks: they prove classes compile and
reference `--a2z-*`. They cannot prove a component *behaves* or *renders*
correctly, so every migration still ends with a manual browser check. That
does not scale to the 8 components left, and it is the bottleneck for
agent-driven work — an agent cannot hard-refresh and squint.

Three layers, in the order they pay off:

- [ ] **Vitest + React Testing Library** (jsdom). Component contracts:
      Modal opens/closes, Escape fires `onClose`, `isDismissible={false}`
      blocks it, `variant="unstyled"` skips chrome. Fast, no browser.
- [ ] **Vitest Browser Mode** (real browser via Playwright). The layer that
      matters for token work: `getComputedStyle()` on real DOM, so a test
      can assert the panel is `rgb(31 41 55)` in dark mode. jsdom returns
      empty/wrong computed styles, so this cannot be faked there. Directly
      replaces the manual devtools check.
- [ ] **Machine-readable output.** Vitest `--reporter=json`, wrapped in a
      small script that strips ANSI and prints one clean pass/fail summary.
      Standard reporter output is built for humans and burns agent tokens
      parsing it. Expose as `npm run test:agent`.

Why Vitest, not Jest: Jest is legacy for new projects, slower, and would
mean a second transform pipeline. Vitest is Jest-compatible on API.

NOTE (2026-10-07): `package.json` has a `test: jest` script but no jest
dependency and no test files exist -- `npm test` currently fails on a
missing binary. It is a dead script, not a working baseline. Removed in
the same commit as this note; the Vitest work adds the real `test` script.

Do NOT: test in jsdom and call rendering verified (it lies about computed
styles); write a test per prop (test the contract, interactions, error
states); add this to both repos at once — start here.

Once in place, a migration's gate becomes `npm run test` +
`npm run test:browser` + `npm run build`, all green before commit. An
agent can run all three and report pass/fail without a human looking.

SCOPE (2026-10-07): this layer is the LIBRARY's, and the "do not add to
both repos at once" rule above still means exactly that. The consumer app
(`../test-app-for-lib`) is getting its own, different layer -- Playwright
screenshots of guide pages -- recorded in that repo's ROADMAP §7. Different
question: this layer asserts component *behaviour*; that one asserts a
*page renders*. Neither substitutes for the other.

## 7. CssTooltip -- a server-renderable tooltip (new component)

DECIDED (2026-10-08): build it, ALONGSIDE the existing Tooltip, not as a
replacement. The interactive Tooltip stays a Client component -- it needs
state, effects, a portal and browser measurement, and every comparable
library (HeroUI, Radix, shadcn, react-tooltip, MUI) ships the same way.
HeroUI only hides the boundary by injecting the directive at build time.
A CSS-only tooltip is a DIFFERENT widget, so it is a second export with
its own API and its own page.

Shape:

- `<CssTooltip content="...">{trigger}</CssTooltip>`, wrapper is a span.
- Pure CSS: `:hover` and `:focus-visible` on the wrapper reveal the
  content through a pseudo-element or a child span. No JS, no state, no
  portal, no measurement. Server-safe by construction.
- Classes go through the existing token layer, so it re-themes with
  everything else.

What it gives up, and the docs must say so plainly:

- no flip-on-overflow, no offset, no delayDuration / closeDelay
- no Escape-to-close, no disabled, no controlled open
- no classNames / styles slot API, no render escape hatch
- content is not portaled, so an `overflow: hidden` ancestor clips it

Open questions before building:

- [ ] pseudo-element (`::after` with `content: attr(data-tip)`) versus a
      real child span. The attr form cannot hold rich content; a child
      span can, and can still be CSS-only.
- [ ] does it need a `placement` at all, or just top? Four-side CSS
      arrows are doable but verbose.
- [ ] arrow: one pseudo-element, or two.
- [ ] a11y: a CSS-only tooltip cannot wire `aria-describedby` only while
      visible. Always-on `aria-describedby` is the usual compromise --
      worth checking against the interactive component.
- [ ] own guide page, or a section on the Tooltip page with the trade-off
      table?

## Rules that keep this list honest

- A migration is done only when it is verified in the consumer app, not when
  the build is green.
- Migrating a component that "looks fine" is the dangerous case — palette
  classes render correctly, so only a browser check catches a bad mapping.
- Shrink the verifier exemption list in the same commit as the migration.

- Update this file on three triggers, not one:
  (a) **same commit as the work** — ticking a box, moving a component
  between lists, correcting a count. The `MIGRATED` note above already
  states this; it applies to every claim here.
  (b) **its own commit** — planning edits: new items, reordering,
  deleting finished sections.
  (c) **immediately** — a stale claim found mid-task. Not at wrap-up.
  Stale claims are how this file rots; three were found on 2026-10-07
  alone (the `Counter` paragraph, the `PearlButton` note, the migration
  order line).
