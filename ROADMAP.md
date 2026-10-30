# ROADMAP — react-a2z

Living work list. Edit in place, check items off, delete what is done. This file
is NOT published (`package.json#files` excludes it) — it is internal coordination.

Companion docs: [LIBRARY-REFERENCE.md](./LIBRARY-REFERENCE.md) (technical reference),
[AGENTS.override.md](./AGENTS.override.md) (approved Codex guidance),
[RELEASING.md](./RELEASING.md) (version decisions and publish gates), and the
[CLI starter guide](./tests/cli-apps/README.md). Historical session evidence lives
in `docs/history/`.

## Validation pass — 2026-10-30

The user authorized the previously deferred cleanup and validation pass. No
StoreBinding component is being added; store integration stays in the app demo.

Completed fixes:
- Removed five ColorToolsPlayground lint errors: useSyncExternalStore supplies
  the SSR/client readiness snapshot without a setState effect; HTML-map quotes
  retain their rendered text through JSX entities.
- Browser assertions wait for asynchronous class compilation and reveal named
  preset slots explicitly. Reduced-motion checks target the animated preset,
  and the broader theme assertion compares against its actual CSS variable
  instead of assuming an OKLCH serialization.
- Fixed a production-only compiler failure. webpack replaced require.resolve
  with undefined/numeric module IDs, producing API 500s despite a green build.
  Read the two direct app dependency theme files through traced filesystem paths;
  unexpected server failures are logged without exposing details to clients.
- Added A2Z_DIST_DIR for isolated production checks in .next-validation while
  localhost:3000 dev stays intact; ignore generated output in Git/ESLint and
  include its generated types. Production build completed without the old
  createRequire warnings.
- Consumer verification supports --continue-on-error to collect all scenarios,
  preserves unsuccessful exit status, and records the failed phase/CLI counts.
  CLI candidate references/lock metadata reflect the newly packed source.

Passed evidence:
- Package npm test: build plus all 26 component/export contracts.
- Nine release-policy unit tests; full CLI integration and Tailwind 3/4 probes.
- Demo: full lint, all 17 unit contracts, all 304 displayed TypeScript examples,
  and the isolated production build (48 static/generated routes).
- General browser suite: 34 checks in development and 34 against production.
- Production color-tool suite: 12 scenarios and eight generated TS exports;
  history/customization: nine groups; app-owned persistence: six groups. No
  uncaught browser errors. Production compiler endpoint returned 200; a local
  cold smoke request took 234ms and warm requests 10/8ms (not a load benchmark).
- Packed library consumer types, publint and Are the Types Wrong completed.
  publint suggested declaring a reviewed Node engine range; no range was changed.
- All 180 CLI checks, all twelve consumer typechecks and all twelve fresh
  production builds passed after the separate Next.js fixture patch update.
  Coverage: Next (6, App/Pages, src/root, Tailwind 3/4), Vite (3), webpack (2)
  and CRA (1). Report: 2026-10-30T17:46:08.477Z, CLI candidate
  react-a2z-cli-28e9544721d69a60.tgz. Interactive app source stayed intact.

Release/deployment follow-ups (the twelve-consumer suite is now green):
- The former Next consumer build blocker is resolved: all six fixtures and the
  scaffold factory now pin 16.4.3 (commit dd8ad95). The reviewed lockfile change
  is limited to those workspaces and Next-owned packages; sharp is 0.35.5.
  The framework security guard was not bypassed. See the CLI suite README for
  the upstream advisory and reports/cli.json for the complete successful run.
- The demo and parent workspace starters retain their independent Next 16.3.3
  pins. Review their dependency upgrades separately before deployment; this
  fixture update does not certify those dependency trees.
- release:compare exits unsuccessfully because there is no reviewed
  release-plan.json/version decision for the changed 1.1.0 artifact. Packed
  consumer/type checks passed; the release gate was not relaxed. Its candidate
  fingerprint is 0ab6947685e8537aefb96eba42a633b093104571f71c40f83252270ff429b1f1.
- Compiler retry/timeouts, multi-instance/concurrency/deployment measurements
  remain follow-up work. Local smoke timings do not establish production SLOs.

The user authorized committing this checkpoint, then updating the Next.js
fixtures separately and preparing the release-version review. No push or
publication is authorized. Earlier deferred-validation notes below
are historical phase checkpoints; this section supersedes their current status.


Release proposal prepared separately from the fixture patch:
- Recommend react-a2z 2.0.0 for optional preset-name reads, style interface-to-type
  augmentation changes, root class precedence and changed defaults/angle behavior.
- See [release review](./docs/release-review-2.0.0.md) and the library's
  release-plan.draft.json. The draft keeps compatibilityReviewed=false; manifests
  remain 1.1.0 (library) / 0.2.0 (CLI), and the active release gate is unchanged.
- npm confirmed library latest 1.1.0 and returned E404 for react-a2z-cli. The CLI
  has no confirmed public baseline; retain 0.2.0 as the proposed initial release
  and recheck registry identity/access before publication.
- Final version/plan/fingerprint and release:check remain release-preparation
  work. Nothing has been pushed or published.

## Local checkpoint and app-owned persistence — 2026-10-30

The completed work below, including the demo page-width adjustment, is committed
in the local checkpoint. No push or publication is authorized. The user decided
that persistence is app-level: use existing value/defaultValue, change callbacks
and supplied presets. Storage, saved collections and Save/Delete UI belong to
the consuming app. A built-in persistor/storage helper or persistence-specific
component API is outside the package scope. The user subsequently approved the optional app-owned Zustand integration
recorded in the current phase below. Full validation stays
deferred, and future changes require their own commit request.

## Optional Zustand persistence example — 2026-10-30

- [x] Explain controlled value/onValueChange, initial defaultValue and supplied
  presets before the focused examples. Keep Try it live first and link to the
  app integration example; package API and CLI registry source stay unchanged.
- [x] App-only Zustand 5.0.15 dependency and per-instance/request store factory.
  Restore after mount with skipHydration; gate writes until successful loading.
  Persist only current value and up to 12 favorites through partialize.
- [x] Validate envelopes, version, colors/angle, IDs, names and collection limits.
  Preserve invalid/future data until explicit Reset; storage failure keeps edits
  in memory with accessible feedback. Keep undo, styling and UI settings temporary.
- [x] App-owned Save/Load/Delete/Reset UI, optional names and preset mapping.
  Demonstrate refresh restoring edits/favorites while undo history starts empty.
- [x] Exact standalone source generated from running store/UI, with drift check,
  focused TypeScript check and compact/full-screen copy workflow. Preserve local
  CLI import guidance and show Zustand as an optional app integration.

Focused evidence: six persistence unit/source contracts passed, including
instance isolation, no writes before hydration, validation, corruption/future
versions, denied/full storage, collection limits and exact standalone typing.
Six isolated browser groups passed for refresh, named/unnamed favorites,
preset/undo/external-load behavior, deletion/reset, unavailable storage, exact
clipboard copying, modal Escape/focus restoration and 390px layouts. No browser
runtime errors. Demo TypeScript and targeted lint passed; production/full suites
remain deferred. Working changes are uncommitted. The npm lock refresh adds the
pinned direct Zustand dependency and refreshes linked package metadata, without
upgrading other resolved dependency versions.

## Custom history button content — 2026-10-30

- [x] Expose `undoLabel`/`redoLabel`, React-node `undoIcon`/`redoIcon`, and
  `undoAriaLabel`/`redoAriaLabel`. Empty text/null icons hide each part; accessible
  names retain fallback text. Keep history, keyboard actions and button targets.
- [x] Add separate icon/label classNames/styles slots and data-slot wrappers;
  decorative icons are hidden from accessibility and SVGs receive useful sizing.
- [x] Teach these props in Props with independent fields and icon-only/text-only
  actions. Preserve JSON/export fidelity and old configs; map all new slots and
  style presets. Minimal editor demonstrates actual custom SVGs with hidden text.
- [x] Update generated CLI source/types, prop metadata, docs and install guide.

Focused evidence: four GradientMaker render contracts, six configuration tests,
package/demo TypeScript and the CLI source/type/style probe in Tailwind 3 and 4.
Nine focused browser groups passed in `test-app-for-lib/scripts/test-gradient-history.mjs`,
including hidden labels, replacement symbols, text-only buttons, custom accessible
names, actual SVG icon sizing and icon-only Undo behavior. Six standalone
examples/exports typechecked. The default inspected editor remains visible at
720px (620px high); narrow layouts have no horizontal overflow.
The user authorized a local checkpoint commit; full tests/production/consumer suites stay deferred.

## Optional preset names — 2026-10-30

- [x] Make `GradientPreset.name` optional and add `showPresetNames` (default
  false). Render supplied nonblank names only; retain tooltips and accessible
  names, with numbered fallbacks for unnamed choices. Preserve current value.
- [x] Expose `presetName` classNames/styles and span data-slot independently
  of the preset button; readable defaults and truncation keep thumbnails compact.
- [x] Add Props toggle, optional-name JSON validation, faithful Code exports,
  old-config defaults, slot map and both complete style presets. Update CLI
  source/types/help, technical/install docs and generated prop metadata.

Focused evidence: three package render contracts, five configuration contracts,
package/demo TypeScript and CLI source/style/type probes for Tailwind 3 and 4.
Eight browser check groups passed in `test-app-for-lib/scripts/test-gradient-history.mjs`,
including named/unnamed visibility, application of unnamed presets, custom label
classes and faithful exports. Long names fit the 390px layout without overflow;
the default inspected editor remains 618px high. No browser runtime errors.
The user authorized a local checkpoint commit; full suites/production/packed consumers stay deferred.

## Completed numeric angle/history phase — 2026-10-30

The user approved these next two suggestions and a local checkpoint commit,
including the staged demo page-width adjustment. No push/publication is authorized.

- [x] Numeric angle input beside the slider: valid whole degrees 0–360 update
  the slider/preview/export live; Enter/blur finishes a grouped edit, Escape
  clears invalid drafts, invalid drafts preserve output, external updates
  discard drafts, and reserved validation space avoids layout shifts.
- [x] Undo/redo complete gradient values in controlled and uncontrolled modes
  through both callbacks. Keep 50 edits, group slider drags/held arrow keys and
  native color interactions, ignore unchanged edits, clear redo on new edits,
  and reset on external controlled values. Native text/number undo stays local.
- [x] Visibility props `showAngleNumber` and `showHistory`, all typed slots,
  complete style presets/maps, compatible older configs, exact exports, prop
  metadata, CLI registry/help and installation docs.
- [x] Compact label/history header and spacing: default inspected editor is
  618px high and fits the 720px desktop viewport; 390px layout has no overflow.

Focused evidence: package/demo TypeScript; four configuration tests; seven
browser check groups in `test-app-for-lib/scripts/test-gradient-history.mjs`
(live number-to-slider/preview/export updates before Enter/blur, invalid drafts,
numeric/keyboard/pointer grouping, HEX/native color,
stop/preset history, branching/shortcuts, external resets, disabled/hiding,
uncontrolled CSS callback, 50-edit bound and narrow layout). No browser runtime
errors. CLI source/type/style probes passed Tailwind 3 and 4. Registry refreshed.
Two package render contracts and six standalone GradientMaker examples/exports
also passed. Targeted lint found five pre-existing ColorToolsPlayground errors
(the readiness effect and four unescaped quotes), confirmed against HEAD; the
other targeted files had no lint findings. Track these in final validation.
Full suites, packed/real consumer apps and demo production build stay deferred.

## Completed color-stop/class-information phase — 2026-10-30

The user explicitly selected the two priorities below; other usability proposals
are outside this phase. The user authorized a local checkpoint commit on
2026-10-30; this is not a release, push or publication authorization.

- [x] Add/remove/reorder committed colors through the existing `GradientValue`
  API, preserving both change callbacks and evenly spaced stops. Keep one stop;
  append white; cap adding with `maxColors` (default 32, clamped 1–32) without
  truncating supplied values/presets. `showColorActions` hides action controls.
- [x] Add typed slots/styles for stop headers, actions, hints and announcements;
  accessible disabled/boundary behavior and focus after operations.
- [x] Update generated CLI source/description, help, install docs, demo props,
  examples and technical docs. No new helper dependencies were introduced.
- [x] Coordinate real default/applied class inspection with the demo without
  duplicating package class strings.

Focused evidence: package typecheck and Rollup refresh passed; two GradientMaker
render contracts and nine demo compiler/configuration contracts passed. The
CLI source/type/style probe passed for Tailwind 3 and 4 (its temporary Windows
junctions required filesystem elevation). Manual browser checks verified
controlled/uncontrolled actions, callbacks, focus, boundaries and class inspection.
Full consumer/packed/release suites and demo production checks remain deferred.

## Color tools checkpoint — 2026-10-29

Current approved guidance is `AGENTS.override.md` and the component design/demo
rules it references. Older migration notes below are historical; their references
to legacy agent instructions do not override the approved guidance or the user's
current validation workflow.

- [x] Preset thumbnails stay fixed at their explicit angle or 90 degrees.
  Changing the angle updates the active gradient; applying a preset without an
  angle preserves the current editor angle.
- [x] Reduced built-ins to one row: Sunset Orange (two colors), Ocean Blue
  (three), then Rainbow (seven). Larger custom lists remain supported.
- [x] Regenerated the CLI source registry and refreshed local package output.
  These are local changes; no npm publication is implied.
- [x] Updated technical docs, CLI docs, and synchronized design rules.

Next priorities discussed, not implemented:

- [x] Add/remove/reorder gradient color stops (2026-10-30), preserving current controlled and
  uncontrolled APIs and delivering the corresponding demo and CLI changes.
- [x] Coordinate default/override/resolved class information with the demo (2026-10-30).
- [x] Direct numeric angle input and undo/redo (2026-10-30; details above).
- [ ] Consider stop positions, then
  radial/conic gradients. Decide their APIs before implementation.

Validation for this checkpoint: registry generation and Rollup output passed;
focused render checks verified fixed thumbnails, three built-ins, explicit
hiding, larger custom lists, and synchronized rules. Related browser checks are
recorded in the demo roadmap. Full package tests, CLI integrations, Tailwind v3/v4
consumers, packed consumers, release/version review, pushes and publishing are
not completed for this checkpoint. Run the deferred suites at final validation.

## Earlier project status (updated 2026-10-11)

- The library now exports `Checkbox`, `Switch`, `Select`, `MultiSelect`,
  `AutocompleteInput`, `Textarea`, `Tabs`, `Accordion`, `Badge`, `Card`,
  `Progress`, and `Skeleton` in addition to the original components.
- The separate CLI copies Select, ColorPicker, and GradientMaker source and configures existing Tailwind v3/v4
  projects. Repair preserves component/helper edits and backs up changed setup
  files. Existing copied source does not update automatically.
- `npm test` builds and runs component/export contracts. `release:check` compares
  the packed library against its published baseline and requires a reviewed
  version decision for changed content. CLI packing has its own integration and
  Tailwind compilation checks. Neither gate automatically chooses a CLI bump.
- Twelve tracked consumer apps under `tests/cli-apps` cover Next App/Pages Router,
  Vite, plain React with webpack, and CRA. `cli:apps:check` verifies 180 CLI
  behaviors plus fresh typechecks/production builds. Interactive browser checks
  remain manual. This larger suite is not an automatic publish hook.

The migration notes below describe the original fourteen-component group;
their counts do not include the twelve additions listed above.

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

**Color tools updated (2026-10-15).** ColorPicker and GradientMaker expose
typed slots and stable `data-slot` markers for every styled part, including HEX
validation messages. Both demos have Props/classNames/Code playgrounds,
complete style presets, scoped slot highlighting, resets, and exact TypeScript
exports with a full-screen viewer. Existing per-slot `styles` remain supported.

GradientMaker now supports controlled `value` / `onValueChange` and uncontrolled
`defaultValue` using `{ colors, angle }`. Its original CSS callback remains.
Presets preserve the current angle unless they supply one. Both tools support
validated HEX drafts. Gradient stops remain evenly spaced. Add/remove/reorder
controls landed in the 2026-10-30 phase above; positioning stops, opacity, and
alternate gradient types remain future work.

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

## 6. Test infrastructure — current coverage and remaining work

Implemented:

- [x] `npm test`: a full build followed by Node's test runner in
  `tests/components.test.mjs`. Checks exports in ESM/CommonJS, client
  directives, selected server-rendered accessibility/form contracts, syntax
  highlighting, and class override priority.
- [x] `release:check`: policy tests, packed consumer type checks, publint,
  Are the Types Wrong, and API/CSS/slot baseline comparison.
- [x] `cli:test` and CLI `prepack`: installer integration and actual Tailwind
  v3/v4 compilation, including safe repair/config preservation.
- [x] `cli:apps:check`: a packed candidate, 180 CLI checks, and fresh
  TypeScript/production builds in twelve consumer scenarios. JSON and per-app
  build logs are saved in `tests/cli-apps/reports` (ignored by Git).

These tests do not yet simulate all component interactions or verify computed
styles in a real browser. The Node component suite renders static markup;
Tailwind compilation proves classes are generated, not that every interaction
or layout behaves correctly. Browser verification remains necessary.

Remaining possible layers:

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

Vitest, `test:browser`, and `test:agent` are proposals, not installed tooling or
available scripts in this repository. Keep tests focused on contracts,
interactions, and error states; jsdom cannot establish real computed-style
correctness. The main demo app's page/screenshot checks serve a different
purpose from library component behavior and CLI installation checks.

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
