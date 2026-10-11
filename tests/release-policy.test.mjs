import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareContracts,
  fingerprint,
  validatePlan,
} from "../scripts/release-policy.mjs";

const before = {
  api: "Select(value: string)",
  exports: { ".": "./index.js", "./Select": "./select.js" },
  cssTokens: ["--a2z-primary"],
  dataSlots: ["select-root"],
  peerDependencies: { react: ">=18" },
  engines: {},
  assets: {},
};
const plan = (after, bump, version) => ({
  package: "react-a2z",
  fromVersion: "1.1.0",
  toVersion: version,
  bump,
  candidateFingerprint: fingerprint(after),
  reason: "Reviewed unchanged consumer examples and supported styling.",
  compatibilityReviewed: true,
  breakingChanges: [],
  migration: "",
});
const validate = (after, record) =>
  validatePlan(record, {
    beforeVersion: "1.1.0",
    candidateVersion: record.toVersion,
    candidateFingerprint: fingerprint(after),
    comparison: compareContracts(before, after),
  });

test("runtime-only fixes still require a reviewed decision bound to the artifact", () => {
  const after = { ...before, assets: { "index.js": "new behavior" } };
  assert.equal(compareContracts(before, after).changed, true);
  assert.deepEqual(validate(after, plan(after, "patch", "1.1.1")), []);
  const stale = {
    ...plan(after, "patch", "1.1.1"),
    candidateFingerprint: fingerprint(before),
  };
  assert.ok(validate(after, stale).some((error) => /stale/.test(error)));
});
test("API additions cannot silently ship as patches", () => {
  const after = { ...before, api: before.api + "\nNewComponent()" };
  assert.ok(
    validate(after, plan(after, "patch", "1.1.1")).some((error) =>
      /at least a minor/.test(error),
    ),
  );
  assert.deepEqual(validate(after, plan(after, "minor", "1.2.0")), []);
});
test("removed exports, CSS tokens, and stable slots require major and migration", () => {
  for (const after of [
    { ...before, exports: { ".": "./index.js" } },
    { ...before, cssTokens: [] },
    { ...before, dataSlots: [] },
  ]) {
    assert.equal(compareContracts(before, after).knownBreaking, true);
    assert.ok(
      validate(after, plan(after, "minor", "1.2.0")).some((error) =>
        /at least a major/.test(error),
      ),
    );
    const major = {
      ...plan(after, "major", "2.0.0"),
      migration: "Replace the removed API with its documented replacement.",
    };
    assert.deepEqual(validate(after, major), []);
  }
});
test("declared behavior breaks need major even when type signatures are unchanged", () => {
  const record = {
    ...plan(before, "patch", "1.1.1"),
    breakingChanges: ["Changed controlled behavior"],
  };
  assert.ok(
    validate(before, record).some((error) => /at least a major/.test(error)),
  );
});
test("decision cannot use an old version or skip compatibility review", () => {
  const record = {
    ...plan(before, "patch", "1.1.0"),
    compatibilityReviewed: false,
  };
  assert.ok(validate(before, record).some((error) => /newer/.test(error)));
  assert.ok(
    validate(before, record).some((error) =>
      /compatibilityReviewed/.test(error),
    ),
  );
});
test("prerelease targets still enforce the correct eventual bump", () => {
  const after = { ...before, cssTokens: [] };
  const record = {
    ...plan(after, "major", "2.0.0-beta.1"),
    migration: "Switch to the replacement CSS token before upgrading.",
  };
  assert.deepEqual(validate(after, record), []);
});

test("removing public props or making an optional prop required needs major", () => {
  const oldApi = {
    ...before,
    api: "export interface Props { value?: string; label?: string; }",
  };
  for (const api of [
    "export interface Props { value?: string; }",
    "export interface Props { value: string; label?: string; }",
  ]) {
    assert.equal(
      compareContracts(oldApi, { ...oldApi, api }).knownBreaking,
      true,
    );
  }
  assert.equal(
    compareContracts(oldApi, {
      ...oldApi,
      api: oldApi.api + "\nexport const NewComponent: unknown;",
    }).knownBreaking,
    false,
  );
});
test("removed named exports require major even when the package export map is unchanged", () => {
  const oldApi = {
    ...before,
    api: "export const Button: unknown; export interface Props {}",
  };
  const changes = compareContracts(oldApi, {
    ...oldApi,
    api: "export const Button: unknown;",
  });
  assert.deepEqual(changes.removedSymbols, ["Props"]);
  assert.equal(changes.knownBreaking, true);
});

test("fingerprints ignore JSON key order and still detect content changes", () => {
  assert.equal(
    fingerprint({ a: 1, b: { x: 2, y: 3 } }),
    fingerprint({ b: { y: 3, x: 2 }, a: 1 }),
  );
  assert.notEqual(fingerprint({ a: 1 }), fingerprint({ a: 2 }));
});
