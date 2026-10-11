# Versioning and release decisions

Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
Choose the version by the effect on existing consumers, not the amount of code
changed. Compare against the latest published version of **each package**.

`react-a2z` is already stable at 1.1.0. Treat its existing public API as a
compatibility promise. `react-a2z-cli` is independently versioned at 0.2.0 and
is still in initial development.

## Choosing the library version

- **Patch**, for example 1.1.0 -> 1.1.1: compatible fixes to documented behavior,
  such as correcting tooltip positioning or Windows-independent packaging issues.
- **Minor**, for example 1.1.0 -> 1.2.0: compatible additions, such as a new component,
  an optional prop that preserves previous defaults, or a new styling slot.
  Deprecating an API while keeping it working also requires a minor release.
- **Major**, for example 1.1.0 -> 2.0.0: incompatible changes, such as removing a
  component/prop/export, making a prop required, changing a callback's arguments,
  changing supported value types incompatibly, or dropping a supported environment.

Use the highest impact across all changes in the release: any breaking change
requires a major release, even if it is one line or is described as a bug fix.
A minor or major release resets the lower version numbers to zero.

## What compatibility covers here

Review more than whether the package compiles:

- Public exports, import paths, TypeScript props/types, refs, and callbacks.
- Controlled/uncontrolled behavior, defaults, form submission values, keyboard
  interactions, and accessibility behavior consumers rely on.
- Documented CSS imports, tokens, `classNames` slots, stable `data-slot` markers,
  and style override behavior. Removing/renaming these can break customized apps.
- Supported React, Tailwind, Node, and other peer dependency versions, plus ESM,
  CommonJS, and supported Next.js server/client usage. Raising a minimum or
  narrowing support can require consumer migration.

Small visual corrections are not automatically breaking. A redesign that changes
documented styling behavior or requires consumers to rework layouts/customization
needs a compatibility review and may require a major release. Adding an optional
prop can still be breaking if it changes existing behavior by default.

When replacing an API, prefer adding the replacement and retaining the old API as
a deprecated alias in a minor release. Remove it in a later major release with a
migration guide.

## CLI and copied source

Version CLI commands, flags, `a2z.json`, output paths, dependency installation, and
generated source behavior as its own public interface. CLI-only changes do not
require a library release. When library component changes affect copied source,
rebuild and review the CLI registry and release the CLI too if its output changes.
The two packages do not have to share a version number.

Our convention while the CLI remains 0.x: patches for compatible fixes and minor
bumps for new features or breaking changes, with breaking changes explicitly
listed. SemVer does not promise a stable API for 0.x; this convention does not
replace migration notes. Release 1.0.0 when the CLI interface is ready for a stable
compatibility commitment, then use the normal major/minor/patch rules.

New CLI versions affect future installs; source already copied into an app does
not update automatically. An incompatible generated component change still needs
release notes and a migration path for users refreshing their components.

## Before each release

The repository now provides an automated library gate:

```bash
npm run release:check
```

It runs release-policy tests, a fresh library build and component tests, compiles
consumer examples against the packed tarball, runs publint and Are the Types Wrong,
and compares the result with a snapshot taken from the published npm version.
Normal `npm publish` invokes it through `prepublishOnly` and additionally checks
the live npm version and prerelease tag. Nothing is published by `release:check`.

The type checker uses the Node16 profile, covering modern Node ESM/CommonJS and
bundler resolution. Legacy TypeScript `node10` subpath resolution is outside this
gate. CSS entry points are excluded only from the TypeScript analyzer; the
package-export tests and publint still check their existence. API Extractor's
documentation-only warnings are suppressed, while analysis errors still fail.
The checks require Node.js 20.9+ for the development tooling and `tar` on PATH;
this does not change the library or CLI consumer requirements.

When package content changes, the gate intentionally stops until a reviewed
decision is recorded. Use this workflow:

1. Review the API diff and the reported changed entry points, removed exported
   names/props, CSS tokens, and literal `data-slot` markers. Reports are written to
   `.release-tmp/candidate.api.md` and `candidate-contract.json`.
2. Choose the version using the rules above and update it with
   `npm version patch --no-git-tag-version` (or `minor` / `major`). This is a local
   change; it does not publish.
3. Copy `release-plan.example.json` to `release-plan.json`. Fill in the versions,
   bump, concrete reason, breaking changes, migration steps, and fingerprint
   printed by `npm run release:compare`. Set `compatibilityReviewed` to true only
   after actually reviewing the candidate. Commit the plan with the release.
4. Run `npm run release:check` again. Any further public package changes invalidate
   the recorded fingerprint and require the decision to be reviewed again.

The policy automatically requires major for detected export/member removals,
newly required public object members, and removed CSS tokens or literal slot
markers. Other API-report changes conservatively require at least minor, even
for some compatible type fixes. Changed property types, callbacks, inherited
types, defaults, dynamic slot names, and interaction behavior still need human
review; these can require major even when the policy's automatic minimum is minor
or patch. The supplied examples cover representative usages, not every component.

After a stable release has actually been published, capture that exact version:

```bash
npm run release:baseline -- 1.1.1
```

Then update `baselineVersion` in `release.config.json` and commit the new snapshot.
Existing snapshots are never overwritten by this command. The initial baseline
is the real published `react-a2z@1.1.0` tarball with its npm integrity recorded.
The publish gate requires the configured baseline to match npm's current `latest`.

The independent CLI runs its registry build, integration tests, and real Tailwind
v3/v4 style compilation through its own `prepack` hook. These cover version
detection, config preservation, dry runs, and safe repair. The TypeScript/API
baseline gate is for the library package.

Additional manual release checks:

1. Review the full changes since that package's previous release. Record the
   affected package, proposed bump, reason, and any migration steps in release notes.
2. Check all public interfaces above. If existing supported usage stops working,
   classify it as breaking; adding many features does not by itself make a major.
3. Keep consumer examples from the previous stable version and compile/run them
   against the candidate without editing those examples. Test interactions and
   styling in addition to types. Existing tests establish confidence only for the
   cases they cover; passing them cannot prove all backward compatibility.
4. For a library release, run `npm test`, check affected demos, and test the actual
   packed artifact in a consumer app. Verify documented import paths and styles.
   For a CLI release, run `npm run cli:check` and test its packed executable in a
   temporary app. The CLI's prepack hook already builds and runs integration tests.
5. For uncertain or breaking releases, publish a prerelease such as
   `2.0.0-beta.1` with `--tag beta`, and let consumers test it explicitly. Use both
   a prerelease version and the tag: `beta` alone does not change the version's
   meaning. [npm dist-tags](https://docs.npmjs.com/cli/v11/commands/npm-dist-tag/)
   keep this release separate from the default `latest` installation.
6. Bump only the affected package versions, keep lockfiles consistent, and publish
   only after validation. Never replace the contents of an already published
   version. Release notes should explain the before/after behavior and migration.

## Recording decisions

For each release, record:

- Package and previous -> proposed version.
- Compatibility: patch, minor, or major, with the concrete reason.
- Changes consumers will see and any required migration.
- Validation performed, including consumer checks and known limitations.

[Changesets](https://changesets.dev/guide/getting-started)
can collect these decisions per change and automate version/changelog updates for
multiple packages. A reviewer still chooses and verifies the impact; automation
cannot infer every behavioral or styling break from a diff. Changesets is not
currently installed in this repository.
