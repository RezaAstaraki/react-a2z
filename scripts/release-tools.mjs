import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, readdir, mkdir, mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const readJson = async (path) =>
  JSON.parse(await readFile(path, "utf8"));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => value.replace(/\r\n/g, "\n");

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} failed: ${result.error?.message ?? result.stderr ?? result.status}`,
    );
  return result.stdout;
}

export function npm(args, options = {}) {
  if (!process.env.npm_execpath)
    throw new Error("Run this script through its npm run command.");
  return run(process.execPath, [process.env.npm_execpath, ...args], options);
}

export async function temporaryWork(callback) {
  const parent = resolve(root, ".release-tmp");
  await mkdir(parent, { recursive: true });
  const temp = await mkdtemp(resolve(parent, "check-"));
  try {
    return await callback(temp);
  } finally {
    if (!resolve(temp).startsWith(parent + sep))
      throw new Error("Invalid release cleanup target.");
    await rm(temp, { recursive: true, force: true });
  }
}

export async function packAndExtract(spec, temp) {
  const result = JSON.parse(
    npm([
      "pack",
      spec,
      "--ignore-scripts",
      "--json",
      "--pack-destination",
      temp,
      "--registry=https://registry.npmjs.org",
      ...(spec === "." ? [] : ["--offline=false"]),
    ]),
  )[0];
  const tarball = resolve(temp, result.filename);
  run("tar", ["-xf", tarball, "-C", temp]);
  return {
    packageRoot: resolve(temp, "package"),
    tarball,
    integrity: result.integrity,
  };
}

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules") continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await files(path)));
    else if (entry.isFile()) results.push(path);
  }
  return results;
}

export async function contractFor(packageRoot, output) {
  const pkg = await readJson(resolve(packageRoot, "package.json"));
  await mkdir(output, { recursive: true });
  const entry = resolve(packageRoot, pkg.types);
  const config = ExtractorConfig.prepare({
    configObject: {
      projectFolder: root,
      mainEntryPointFilePath: entry,
      compiler: {
        overrideTsconfig: {
          compilerOptions: {
            target: "ESNext",
            module: "ESNext",
            moduleResolution: "Node",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            jsx: "react",
            types: ["react", "react-dom"],
          },
          files: [entry],
        },
      },
      apiReport: {
        enabled: true,
        reportFileName: "react-a2z",
        reportFolder: output,
        reportTempFolder: output,
      },
      docModel: { enabled: false },
      dtsRollup: { enabled: false },
      tsdocMetadata: { enabled: false },
      newlineKind: "lf",
      messages: {
        compilerMessageReporting: { default: { logLevel: "error" } },
        extractorMessageReporting: {
          default: { logLevel: "warning" },
          "ae-missing-release-tag": { logLevel: "none" },
          "ae-forgotten-export": { logLevel: "none" },
          "ae-unresolved-link": { logLevel: "none" },
          "ae-undocumented": { logLevel: "none" },
        },
        tsdocMessageReporting: { default: { logLevel: "none" } },
      },
    },
    configObjectFullPath: undefined,
    packageJson: pkg,
    packageJsonFullPath: resolve(packageRoot, "package.json"),
  });
  const extraction = Extractor.invoke(config, {
    localBuild: true,
    showVerboseMessages: false,
  });
  if (!extraction.succeeded || extraction.errorCount)
    throw new Error("API Extractor could not analyze the package.");
  const assets = {};
  const cssTokens = new Set();
  const dataSlots = new Set();
  for (const path of await files(packageRoot)) {
    if (!/\.(?:[cm]?js|css|d\.[cm]?ts)$/.test(path)) continue;
    const content = normalize(await readFile(path, "utf8"));
    assets[relative(packageRoot, path).split(sep).join("/")] = hash(content);
    if (path.endsWith(".css"))
      for (const match of content.matchAll(/(--a2z-[\w-]+)\s*:/g))
        cssTokens.add(match[1]);
    if (path.endsWith(".js"))
      for (const match of content.matchAll(
        /["']data-slot["']\s*:\s*["']([^"']+)["']/g,
      ))
        dataSlots.add(match[1]);
  }
  return {
    api: normalize(await readFile(resolve(output, "react-a2z.api.md"), "utf8")),
    exports: pkg.exports ?? {},
    peerDependencies: pkg.peerDependencies ?? {},
    dependencies: pkg.dependencies ?? {},
    entryFields: {
      main: pkg.main ?? null,
      module: pkg.module ?? null,
      types: pkg.types ?? null,
      sideEffects: pkg.sideEffects ?? null,
    },
    engines: pkg.engines ?? {},
    cssTokens: [...cssTokens].sort(),
    dataSlots: [...dataSlots].sort(),
    assets,
  };
}
