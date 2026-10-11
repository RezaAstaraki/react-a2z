import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { scenarios } from "./scenarios.mjs";
import { createApp, cliArgs } from "./scaffold.mjs";
import { root, cli, npm } from "./process.mjs";

const buildFreshApps = process.argv.includes("--build");

async function snapshot(directory) {
  const files = {};
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (["node_modules", ".next", "dist", "build"].includes(entry.name)) continue;
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(child);
      else files[relative(directory, child)] = createHash("sha256").update(await readFile(child)).digest("hex");
    }
  }
  await visit(directory);
  return files;
}
function invoke(directory, args, expected = 0) {
  const result = spawnSync(process.execPath, [cli, ...args, "--cwd", directory, "--skip-install"], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, expected, `${result.error ?? ""}\n${result.stdout}\n${result.stderr}`);
  return result;
}
await mkdir(resolve(root, ".checks"), { recursive: true });
const temporary = await mkdtemp(resolve(root, ".checks/run-"));
const results = [];
let current;
try {
  for (const s of scenarios) {
    current = s.id;
    const app = resolve(root, "apps", s.id);
    const require = createRequire(resolve(app, "package.json"));
    const installed = JSON.parse(await readFile(require.resolve("tailwindcss/package.json"), "utf8"));
    assert.equal(Number(installed.version.split(".")[0]), s.tw);
    const directory = resolve(temporary, s.id);
    await createApp(s, directory);
    let appModulesExist = false;
    try { await access(resolve(app, "node_modules")); appModulesExist = true; } catch {}
    if (buildFreshApps && appModulesExist) {
      await symlink(resolve(app, "node_modules"), resolve(directory, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    } else {
      await mkdir(resolve(directory, "node_modules"), { recursive: true });
      await symlink(dirname(require.resolve("tailwindcss/package.json")), resolve(directory, "node_modules/tailwindcss"), process.platform === "win32" ? "junction" : "dir");
    }
    const before = await snapshot(directory);
    invoke(directory, ["add", "select", "--dry-run", ...cliArgs(s)]);
    assert.deepEqual(await snapshot(directory), before, `${s.id}: dry run mutated the project`);
    invoke(directory, ["add", "select", ...cliArgs(s)]);
    const config = JSON.parse(await readFile(resolve(directory, "a2z.json"), "utf8"));
    assert.equal(config.tailwindVersion, s.tw);
    assert.equal(config.components, s.customPath ? "src/components/custom-ui" : `${s.src ? "src/" : ""}components/ui`);
    if (!s.src) await assert.rejects(access(resolve(directory, "src")));
    const initialized = await snapshot(directory);
    invoke(directory, ["init"]);
    assert.deepEqual(await snapshot(directory), initialized, `${s.id}: second init changed files`);
    const refusal = invoke(directory, ["add", "select"], 1);
    assert.match(refusal.stderr, /Refusing to overwrite/);
    assert.deepEqual(await snapshot(directory), initialized);
    const component = resolve(directory, config.components, "select.tsx");
    const helper = resolve(directory, config.utils, "cn.ts");
    const styles = resolve(directory, config.styles);
    await writeFile(component, "// consumer customization\n" + await readFile(component, "utf8"));
    await writeFile(helper, "// consumer customization\n" + await readFile(helper, "utf8"));
    await writeFile(styles, await readFile(styles, "utf8") + "\n/* consumer theme override */\n:root { --test-consumer-color: 42; }\n");
    const edited = await snapshot(directory);
    invoke(directory, ["repair", "--dry-run"]);
    assert.deepEqual(await snapshot(directory), edited);
    invoke(directory, ["repair"]);
    assert.deepEqual(await snapshot(directory), edited, `${s.id}: repair changed consumer source`);
    invoke(directory, ["repair"]);
    assert.deepEqual(await snapshot(directory), edited);
    invoke(directory, ["add", "select", "--overwrite"]);
    assert.doesNotMatch(await readFile(component, "utf8"), /consumer customization/);
    assert.match(await readFile(helper, "utf8"), /consumer customization/);
    if (buildFreshApps) {
      for (const task of ["typecheck", "build"]) {
        console.log(`${task}: fresh ${s.id}`);
        await mkdir(resolve(root, "reports"), { recursive: true });
        try {
          const result = npm(["run", task, "--prefix", directory], root, true);
          await writeFile(resolve(root, "reports", `${s.id}.${task}.log`), `${result.stdout}\n${result.stderr}`);
        } catch (error) {
          await writeFile(resolve(root, "reports", `${s.id}.${task}.log`), error.message);
          throw error;
        }
      }
    }
    results.push({ id: s.id, passed: true, tailwind: installed.version, ...(buildFreshApps ? { typecheck: true, build: true } : {}), checks: ["dry-run", "add-auto-init", "layout", "init-idempotence", "overwrite-protection", "repair-dry-run", "repair-preserves-edits", "repair-idempotence", "explicit-overwrite"] });
    console.log(`PASS ${s.id}: 9 CLI checks, installed Tailwind ${installed.version}`);
  }
} catch (error) {
  results.push({ id: current, passed: false, error: error.message });
  throw error;
} finally {
  // Only remove the fresh directory created by this run, never consumer apps.
  assert.equal(dirname(temporary), resolve(root, ".checks"));
  await rm(temporary, { recursive: true, force: true });
  await mkdir(resolve(root, "reports"), { recursive: true });
  const candidate = JSON.parse(await readFile(resolve(root, "package.json"), "utf8")).devDependencies["react-a2z-cli"];
  await writeFile(resolve(root, "reports/cli.json"), JSON.stringify({ date: new Date().toISOString(), candidate, freshBuilds: buildFreshApps, expectedScenarios: scenarios.length, results }, null, 2));
}
console.log(`All ${results.length} scenarios passed (${results.length * 9} checks). Starter apps were not modified.`);
