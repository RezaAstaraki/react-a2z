import { copyFile, writeFile, mkdir, readdir, symlink } from "node:fs/promises";
import { resolve } from "node:path";
import semver from "semver";
import {
  root,
  readJson,
  run,
  npm,
  temporaryWork,
  packAndExtract,
  contractFor,
} from "./release-tools.mjs";
import {
  fingerprint,
  compareContracts,
  validatePlan,
} from "./release-policy.mjs";

const config = await readJson(resolve(root, "release.config.json"));
const baseline = await readJson(
  resolve(root, "release/baselines", config.baselineVersion, "contract.json"),
);
const candidate = await readJson(resolve(root, "package.json"));
const publishing = process.argv.includes("--publish");
const failures = [];
await temporaryWork(async (temp) => {
  const packed = await packAndExtract(".", temp);
  const consumer = resolve(temp, "consumer");
  await mkdir(resolve(consumer, "node_modules"), { recursive: true });
  await symlink(
    packed.packageRoot,
    resolve(consumer, "node_modules/react-a2z"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const fixtures = [];
  for (const name of await readdir(resolve(root, "tests/consumer"))) {
    if (!/\.[cm]ts$/.test(name)) continue;
    const target = resolve(consumer, name);
    await copyFile(resolve(root, "tests/consumer", name), target);
    fixtures.push(target);
  }
  console.log("\nCompiling unchanged consumer examples against the tarball...");
  try {
    run(
      process.execPath,
      [
        resolve(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--strict",
        "--esModuleInterop",
        "--target",
        "ES2020",
        "--module",
        "Node16",
        "--moduleResolution",
        "Node16",
        ...fixtures,
      ],
      { stdio: "inherit" },
    );
  } catch {
    failures.push("Packed ESM/CommonJS consumer examples no longer compile.");
  }
  for (const [tool, args] of [
    [
      "publint",
      [
        resolve(root, "node_modules/publint/src/cli.js"),
        packed.tarball,
        "--strict",
      ],
    ],
    [
      "Are the Types Wrong",
      [
        resolve(root, "node_modules/@arethetypeswrong/cli/dist/index.js"),
        packed.tarball,
        "--profile",
        "node16",
        "--no-emoji",
        "--quiet",
        "--no-definitely-typed",
        "--exclude-entrypoints",
        ...Object.keys(candidate.exports).filter((name) =>
          name.endsWith(".css"),
        ),
      ],
    ],
  ]) {
    console.log(`\nChecking ${tool}...`);
    try {
      run(process.execPath, args, { stdio: "inherit" });
    } catch {
      failures.push(`${tool} found packaging/type errors.`);
    }
  }
  const contract = await contractFor(packed.packageRoot, resolve(temp, "api"));
  const candidateFingerprint = fingerprint(contract);
  const comparison = compareContracts(baseline.contract, contract);
  const reportDir = resolve(root, ".release-tmp");
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    resolve(reportDir, "candidate-contract.json"),
    JSON.stringify(
      {
        version: candidate.version,
        candidateFingerprint,
        comparison,
        contract,
      },
      null,
      2,
    ) + "\n",
  );
  await copyFile(
    resolve(temp, "api/react-a2z.api.md"),
    resolve(reportDir, "candidate.api.md"),
  );
  console.log(
    `\nPublished baseline: ${baseline.version}; candidate: ${candidate.version}`,
  );
  console.log(`Candidate fingerprint: ${candidateFingerprint}`);
  console.log(
    `API changed: ${comparison.apiChanged}; public package content changed: ${comparison.changed}`,
  );
  for (const key of [
    "removedExports",
    "changedExports",
    "removedTokens",
    "removedSlots",
    "removedSymbols",
    "removedMembers",
    "requiredMembers",
  ])
    if (comparison[key].length)
      console.log(`${key}: ${comparison[key].join(", ")}`);
  if (comparison.supportChanged)
    console.log("Review peer dependency / supported environment changes.");
  if (comparison.changed || publishing) {
    try {
      const plan = await readJson(resolve(root, "release-plan.json"));
      failures.push(
        ...validatePlan(plan, {
          beforeVersion: baseline.version,
          candidateVersion: candidate.version,
          candidateFingerprint,
          comparison,
        }),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      failures.push(
        "Create release-plan.json from release-plan.example.json; record a reviewed version decision and the candidate fingerprint.",
      );
    }
  }
  if (publishing) {
    // Check the live registry too: a stale committed baseline must not allow
    // republishing or releasing behind a newer stable version.
    const latest = JSON.parse(
      npm([
        "view",
        "react-a2z@latest",
        "version",
        "--json",
        "--offline=false",
        "--registry=https://registry.npmjs.org",
      ]),
    );
    if (latest !== baseline.version)
      failures.push(
        `npm latest is now ${latest}. Capture that published baseline and update release.config.json before reviewing this release.`,
      );
    if (!semver.gt(candidate.version, latest))
      failures.push(
        `Version ${candidate.version} must be newer than npm latest ${latest}.`,
      );
    if (
      semver.prerelease(candidate.version) &&
      (!process.env.npm_config_tag || process.env.npm_config_tag === "latest")
    )
      failures.push(
        "Publish prereleases with an explicit non-latest tag, e.g. --tag beta.",
      );
  }
});
if (failures.length) {
  console.error(
    `\nRelease check failed:\n${failures.map((message) => `- ${message}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nRelease checks passed. Behavior and styling still need the documented consumer review.",
  );
  if (!publishing && candidate.version === baseline.version)
    console.log(
      "This version is already published. A newer version and a release plan are required to publish again.",
    );
}
