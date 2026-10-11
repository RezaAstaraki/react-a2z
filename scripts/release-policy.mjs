import { createHash } from "node:crypto";
import semver from "semver";
import ts from "typescript";

function apiSurface(report) {
  const source = report.match(/```ts\n([\s\S]*?)\n```/)?.[1] ?? report;
  const file = ts.createSourceFile(
    "api.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const symbols = new Set();
  const members = new Map();
  for (const node of file.statements) {
    if (
      !node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    )
      continue;
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations)
        symbols.add(declaration.name.getText(file));
      continue;
    }
    if (!node.name) continue;
    const name = node.name.getText(file);
    symbols.add(name);
    const declarations = ts.isInterfaceDeclaration(node)
      ? node.members
      : ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)
        ? node.type.members
        : [];
    for (const member of declarations) {
      if (!member.name) continue;
      members.set(`${name}.${member.name.getText(file)}`, {
        optional: Boolean(member.questionToken),
      });
    }
  }
  return { symbols, members };
}

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export const fingerprint = (contract) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(contract)))
    .digest("hex");

export function compareContracts(before, after) {
  const oldApi = apiSurface(before.api);
  const newApi = apiSurface(after.api);
  const removedSymbols = [...oldApi.symbols].filter(
    (name) => !newApi.symbols.has(name),
  );
  const removedMembers = [...oldApi.members.keys()].filter(
    (name) => !newApi.members.has(name),
  );
  const requiredMembers = [...newApi.members]
    .filter(
      ([name, member]) =>
        !member.optional &&
        (oldApi.members.get(name)?.optional ||
          (!oldApi.members.has(name) &&
            oldApi.symbols.has(name.split(".")[0]))),
    )
    .map(([name]) => name);
  const removedExports = Object.keys(before.exports).filter(
    (name) => !(name in after.exports),
  );
  const changedExports = Object.keys(before.exports).filter(
    (name) =>
      name in after.exports &&
      JSON.stringify(before.exports[name]) !==
        JSON.stringify(after.exports[name]),
  );
  const removedTokens = before.cssTokens.filter(
    (name) => !after.cssTokens.includes(name),
  );
  const removedSlots = before.dataSlots.filter(
    (name) => !after.dataSlots.includes(name),
  );
  const supportChanged =
    JSON.stringify(before.peerDependencies) !==
      JSON.stringify(after.peerDependencies) ||
    JSON.stringify(before.engines) !== JSON.stringify(after.engines);
  return {
    changed: fingerprint(before) !== fingerprint(after),
    apiChanged: before.api !== after.api,
    knownBreaking:
      removedSymbols.length > 0 ||
      removedMembers.length > 0 ||
      requiredMembers.length > 0 ||
      removedExports.length > 0 ||
      removedTokens.length > 0 ||
      removedSlots.length > 0,
    reviewRequired: changedExports.length > 0 || supportChanged,
    removedExports,
    changedExports,
    removedTokens,
    removedSlots,
    supportChanged,
    removedSymbols,
    removedMembers,
    requiredMembers,
  };
}

export function validatePlan(
  plan,
  { beforeVersion, candidateVersion, candidateFingerprint, comparison },
) {
  const errors = [];
  if (
    !semver.valid(candidateVersion) ||
    !semver.gt(candidateVersion, beforeVersion)
  )
    errors.push(
      `Candidate version must be newer than published baseline ${beforeVersion}.`,
    );
  if (
    plan.package !== "react-a2z" ||
    plan.fromVersion !== beforeVersion ||
    plan.toVersion !== candidateVersion
  )
    errors.push(
      "Release plan must name this package and the exact baseline/candidate versions.",
    );
  if (plan.candidateFingerprint !== candidateFingerprint)
    errors.push(
      "Release plan fingerprint is stale; review the current candidate again.",
    );
  if (plan.compatibilityReviewed !== true)
    errors.push(
      "Record compatibilityReviewed: true only after reviewing behavior, styling, and supported environments.",
    );
  if (
    typeof plan.reason !== "string" ||
    plan.reason.trim().length < 20 ||
    /DESCRIBE THE CHANGE/.test(plan.reason)
  )
    errors.push("Record a concrete compatibility reason in the release plan.");
  if (
    !Array.isArray(plan.breakingChanges) ||
    plan.breakingChanges.some(
      (item) => typeof item !== "string" || !item.trim(),
    )
  )
    errors.push(
      "breakingChanges must be a list of migration-impact descriptions.",
    );
  const declaredBreaking =
    Array.isArray(plan.breakingChanges) && plan.breakingChanges.length > 0;
  const minimumBump =
    comparison.knownBreaking || declaredBreaking
      ? "major"
      : comparison.apiChanged
        ? "minor"
        : "patch";
  const ranks = { patch: 0, minor: 1, major: 2 };
  if (!Object.hasOwn(ranks, plan.bump) || ranks[plan.bump] < ranks[minimumBump])
    errors.push(
      `This candidate needs at least a ${minimumBump} decision. API changes conservatively require minor; detected removals require major.`,
    );
  if (semver.valid(candidateVersion) && Object.hasOwn(ranks, plan.bump)) {
    // Prereleases can exercise the eventual release level, e.g. 2.0.0-beta.1.
    const stable = `${semver.major(candidateVersion)}.${semver.minor(candidateVersion)}.${semver.patch(candidateVersion)}`;
    const expected = semver.inc(beforeVersion, plan.bump);
    if (stable !== expected)
      errors.push(
        `A ${plan.bump} bump from ${beforeVersion} targets ${expected}, optionally with a prerelease suffix.`,
      );
  }
  if (
    (comparison.knownBreaking || declaredBreaking) &&
    (typeof plan.migration !== "string" || plan.migration.trim().length < 20)
  )
    errors.push("Breaking releases require concrete migration instructions.");
  return errors;
}
