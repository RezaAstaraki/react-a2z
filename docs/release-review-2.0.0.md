# Proposed library release: 2.0.0

Review prepared 2026-10-30. This is a proposal, not a release authorization.
Package versions remain unchanged and nothing has been pushed or published.

## Baseline and recommendation

npm reports `react-a2z@1.1.0` as latest. The downloaded tarball matches the
integrity recorded in `release/baselines/1.1.0/contract.json`. Its public API and
color-tool runtime were compared with the current candidate. Only ColorPicker
and GradientMaker have substantive public type changes; the broader changed
entry-point list also reflects packaging/build output.

Recommend **2.0.0**, following RELEASING.md. The release contains useful additions,
but it also changes supported customization and default behavior. A minor bump
would not communicate those migrations adequately.

The current artifact fingerprint is
`0ab6947685e8537aefb96eba42a633b093104571f71c40f83252270ff429b1f1`.
`release-plan.draft.json` records the proposal with compatibilityReviewed=false.
It deliberately does not satisfy or replace the active release gate.

## Consumer changes to review

- **Optional preset names.** `GradientPreset.name` changes from `string` to
  `string | undefined`. Existing named presets still work, but code such as
  `preset.name.toLowerCase()` must handle absence, for example
  `(preset.name ?? "").toLowerCase()`. Visible labels require
  `showPresetNames`; unnamed choices retain accessible fallback names.
- **Style type augmentation.** `ColorPickerStyles` and `GradientMakerStyles`
  change from interfaces to mapped type aliases. Existing slot properties still
  exist; the gate's 17 reported removed members are a syntactic limitation of
  its mapped-type analysis, not 17 removed styling slots. Declaration merging
  into those interfaces is nevertheless no longer supported. Replace consumer
  augmentation with a local intersection type where needed. The gate remains
  unchanged and conservatively requires a major.
- **Root class precedence.** On both color tools, `className` now wins conflicts
  with `classNames.root`. Previously `classNames.root` won. Put the intended
  final root utilities in `className`, or remove conflicting overrides.
- **Defaults and layout.** GradientMaker now supplies three presets instead of
  eleven (Sunset Orange, Ocean Blue, Rainbow). Pass an explicit `presets` array
  to retain a particular palette. Its stop actions, HEX editors, numeric angle
  and history controls are visible by default; hide them with
  `showColorActions={false}`, `showHex={false}`, `showAngleNumber={false}` and
  `showHistory={false}` where a compact existing layout requires it.
  ColorPicker also adds a default HEX editor and changes its built-in palette;
  use `showHex={false}` and explicit `presetColors` to preserve those choices.
- **Preset angle behavior.** In 1.1.0, applying a gradient preset reset the angle
  to 90. Angle-less presets now preserve the editor angle. Add `angle: 90` to
  each supplied preset when that reset is required. Thumbnails always use the
  supplied angle or 90, independently of the active editor angle.
- **Normalization and inspection.** The color tools normalize valid HEX values
  and omit invalid preset entries. GradientMaker requires all colors of a
  preset to be valid; ColorPicker also deduplicates its palette. Its swatches,
  HEX fields, native angle input and nested wrappers use explicit slots;
  inspect customized layouts and selectors after upgrading. GradientMaker no
  longer renders the separate Slider component internally: use its own
  `angleInput`, `angleNumber`, `angleLabel` and related slots instead of selectors
  targeting Slider's internal DOM.

Existing exports, CSS tokens and literal slot markers were not removed by the
contract comparison, and peer/environment declarations did not narrow.
`onGradientChange` remains available; structured `value`, `defaultValue` and
`onValueChange` are additions. No callback fires merely because of mounting.
The package has no storage dependency or built-in persistor. Persistence is
demonstrated through app-owned controlled integration in the demo.

## CLI decision is independent

The CLI manifest is `react-a2z-cli@0.2.0`. A live npm query returned E404 on
2026-10-30; there is no confirmed public version to compare against. Retaining
0.2.0 for a first publication is reasonable. Recheck package identity, access
and registry state before publishing rather than inventing a 0.3.0 baseline.
Its release notes must describe the generated color-tool changes above.
Existing copied source is unchanged until consumers explicitly replace it;
review edits before `add ... --overwrite`. Repair preserves edited helpers.

## Remaining release steps

The package, demo and consumer validation evidence is in ROADMAP.md. Packed
consumer types, publint and Are the Types Wrong passed, but the complete release
gate remains unsuccessful until the version decision is finalized.

If proceeding with 2.0.0, update the library manifest/lockfile without a Git tag,
copy the draft to `release-plan.json`, review the final artifact and replace its
fingerprint with the fresh `release:compare` result. Mark compatibilityReviewed
true only after completing that final review. Run `npm run release:check` and
record its result. A manifest change can alter the artifact; do not assume this
proposal's fingerprint is final. Commit a release-preparation change separately.
Publishing either package requires its own explicit instruction.
