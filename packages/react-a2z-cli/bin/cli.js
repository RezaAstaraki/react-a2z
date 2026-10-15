#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  detectTailwind,
  projectPath,
  relativeImport,
  findV3Config,
  configureV3,
} from "./tailwind.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryRoot = resolve(packageRoot, "registry", "select");
const componentNames = JSON.parse(
  await readFile(resolve(packageRoot, "registry/components.json"), "utf8"),
);
const exists = async (path) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
const importPath = (from, to) => {
  let value = relative(dirname(from), to)
    .split(sep)
    .join("/")
    .replace(/\.(?:ts|tsx)$/, "");
  return value.startsWith(".") ? value : `./${value}`;
};
const usage = () =>
  console.log(`Usage:
  react-a2z-cli init [--cwd path] [--path path] [--overwrite] [--skip-install] [--dry-run]
  react-a2z-cli add <component> [--cwd path] [--overwrite] [--skip-install] [--dry-run]
  react-a2z-cli repair [--cwd path] [--overwrite] [--skip-install] [--dry-run]
  Setup options: --css path --tailwind-config path
  Components: ${componentNames.join(", ")}`);

function parse(argv) {
  const options = { cwd: process.cwd() };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (["--cwd", "--path", "--css", "--tailwind-config"].includes(arg)) {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === "--cwd") options.cwd = resolve(value);
      else if (arg === "--path") options.componentPath = value;
      else if (arg === "--css") options.css = value;
      else options.tailwindConfig = value;
    } else if (arg === "--overwrite") options.overwrite = true;
    else if (arg === "--skip-install") options.skipInstall = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "-y" || arg === "--yes") options.yes = true;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  return { options, positional };
}

const manifest = async () =>
  JSON.parse(await readFile(resolve(registryRoot, "manifest.json"), "utf8"));
function packageManager() {
  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return ["pnpm", "add"];
  if (agent.startsWith("yarn")) return ["yarn", "add"];
  if (agent.startsWith("bun")) return ["bun", "add"];
  return [process.platform === "win32" ? "npm.cmd" : "npm", "install"];
}

async function detectCss(cwd) {
  for (const path of [
    "src/app/globals.css",
    "app/globals.css",
    "src/index.css",
    "src/globals.css",
    "src/style.css",
    "src/main.css",
    "src/styles/globals.css",
    "styles/globals.css",
    "index.css",
    "style.css",
    "main.css",
  ])
    if (await exists(resolve(cwd, path))) return path;
  return null;
}

async function copy(
  source,
  target,
  replacements,
  options,
  sourceRoot = registryRoot,
) {
  if ((await exists(target)) && !options.overwrite)
    throw new Error(
      `Refusing to overwrite ${relative(options.cwd, target)}. Use --overwrite.`,
    );
  console.log(`  ${relative(options.cwd, target)}`);
  if (options.dryRun) return;
  await mkdir(dirname(target), { recursive: true });
  let content = await readFile(resolve(sourceRoot, source), "utf8");
  for (const [from, to] of Object.entries(replacements))
    content = content.replaceAll(from, to);
  await writeFile(target, content, "utf8");
}

const normalize = (value) => value.replaceAll("\r\n", "\n").trim();
const styleStart = "/* react-a2z:styles:start */";
const styleEnd = "/* react-a2z:styles:end */";

async function defaultPaths(cwd) {
  const prefix = (await exists(resolve(cwd, "src"))) ? "src/" : "";
  return {
    components: `${prefix}components/ui`,
    utils: `${prefix}lib/react-a2z`,
    styles: `${prefix}styles/react-a2z.css`,
  };
}

async function setupPlan(options, previous) {
  const tailwind = await detectTailwind(options.cwd);
  const defaults = await defaultPaths(options.cwd);
  const config = {
    ...previous,
    components:
      previous?.components ?? options.componentPath ?? defaults.components,
    utils: previous?.utils ?? defaults.utils,
    styles: previous?.styles ?? defaults.styles,
    css: options.css ?? previous?.css ?? (await detectCss(options.cwd)),
    tailwindVersion: tailwind.major,
  };
  for (const name of ["components", "utils", "styles"])
    projectPath(options.cwd, config[name]);
  if (!config.css)
    throw new Error(
      "No global stylesheet found. Configure Tailwind in your app, then use --css <path> to select its stylesheet. No files were changed.",
    );
  const cssPath = projectPath(options.cwd, config.css);
  const css = await readFile(cssPath, "utf8");
  if (tailwind.major === 4 && !/@import\s+["']tailwindcss["']/.test(css))
    throw new Error(
      'Tailwind v4 is installed, but the global CSS is missing @import "tailwindcss". Configure Tailwind v4 first. No files were changed.',
    );
  if (tailwind.major === 3 && !/@tailwind\s+utilities\s*;/.test(css))
    throw new Error(
      "Tailwind v3 is installed, but the global CSS is missing @tailwind utilities. Configure Tailwind v3 first. No files were changed.",
    );
  const writes = [];
  const styles = projectPath(options.cwd, config.styles);
  let body = await readFile(
    resolve(
      registryRoot,
      tailwind.major === 3 ? "react-a2z.v3.css" : "react-a2z.css",
    ),
    "utf8",
  );
  if (tailwind.major === 4)
    body += `\n@source ${JSON.stringify(relativeImport(styles, projectPath(options.cwd, config.components)))};\n@source ${JSON.stringify(relativeImport(styles, projectPath(options.cwd, config.utils)))};\n`;
  let output = `${styleStart}\n${body.trim()}\n${styleEnd}\n`;
  if (await exists(styles)) {
    const current = await readFile(styles, "utf8");
    const start = current.indexOf(styleStart),
      end = current.indexOf(styleEnd);
    if (
      start >= 0 &&
      end > start &&
      current.indexOf(styleStart, start + styleStart.length) < 0
    ) {
      output =
        current.slice(0, start) +
        output.trimEnd() +
        current.slice(end + styleEnd.length);
    } else {
      const legacy = await readFile(
        resolve(registryRoot, "react-a2z.css"),
        "utf8",
      );
      const v3 = await readFile(
        resolve(registryRoot, "react-a2z.v3.css"),
        "utf8",
      );
      if (
        !options.overwrite &&
        normalize(current) !== normalize(legacy) &&
        normalize(current) !== normalize(v3)
      )
        throw new Error(
          `Custom stylesheet ${config.styles} is protected. Review it, then use repair --overwrite to replace it with a backup. No files were changed.`,
        );
    }
    if (!previous && !options.overwrite)
      throw new Error(
        `Refusing to overwrite ${config.styles}. Use --overwrite.`,
      );
  }
  writes.push({ path: styles, content: output });
  for (const source of ["cn.ts", "extend-merge.ts"]) {
    const path = resolve(projectPath(options.cwd, config.utils), source);
    if (previous && (await exists(path))) continue;
    if ((await exists(path)) && !options.overwrite)
      throw new Error(
        `Refusing to overwrite ${relative(options.cwd, path)}. Use --overwrite.`,
      );
    writes.push({
      path,
      content: await readFile(resolve(registryRoot, source), "utf8"),
    });
  }
  if (tailwind.major === 3) {
    const path = await findV3Config(
      options.cwd,
      options.tailwindConfig ?? config.tailwindConfig,
    );
    config.tailwindConfig = relative(options.cwd, path).split(sep).join("/");
    const presetPath = resolve(
      projectPath(options.cwd, config.utils),
      "tailwind.preset.cjs",
    );
    const source = await readFile(path, "utf8");
    const globs = [config.components, config.utils].map(
      (directory) =>
        `./${relative(options.cwd, projectPath(options.cwd, directory)).split(sep).join("/")}/**/*.{js,ts,jsx,tsx}`,
    );
    const relativeGlobs = [config.components, config.utils].map(
      (directory) =>
        `${relativeImport(path, projectPath(options.cwd, directory))}/**/*.{js,ts,jsx,tsx}`,
    );
    const updated = configureV3(
      source,
      config.tailwindConfig,
      relativeImport(path, presetPath),
      globs,
      relativeGlobs,
    );
    writes.push({ path, content: updated });
    for (const filename of ["tailwind.preset.cjs", "tailwind.preset.d.cts"]) {
      const target = resolve(projectPath(options.cwd, config.utils), filename);
      const content = await readFile(resolve(registryRoot, filename), "utf8");
      if (
        (await exists(target)) &&
        normalize(await readFile(target, "utf8")) !== normalize(content) &&
        !options.overwrite
      )
        throw new Error(
          `Custom preset ${relative(options.cwd, target)} is protected. Use --overwrite after reviewing it. No files were changed.`,
        );
      writes.push({ path: target, content });
    }
  }
  const statement = `@import ${JSON.stringify(relativeImport(cssPath, styles))};`;
  const escaped = relativeImport(cssPath, styles).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const cleaned = css.replace(
    new RegExp(`@import\\s+["']${escaped}["']\\s*;(?:\\r?\\n)?`, "g"),
    "",
  );
  const updatedCss =
    tailwind.major === 4
      ? cleaned.replace(
          /(@import\s+["']tailwindcss["'][^;]*;)/,
          (match) => `${match}\n${statement}`,
        )
      : `${statement}\n${cleaned}`;
  writes.push({ path: cssPath, content: updatedCss });
  writes.push({
    path: resolve(options.cwd, "a2z.json"),
    content: `${JSON.stringify(config, null, 2)}\n`,
  });
  return { tailwind, config, writes };
}

async function applyPlan(plan, options) {
  console.log(`Detected Tailwind CSS ${plan.tailwind.version}.`);
  for (const item of plan.writes) {
    const current = (await exists(item.path))
      ? await readFile(item.path, "utf8")
      : null;
    if (current === item.content) continue;
    console.log(
      `  ${options.dryRun ? "would update" : "updating"} ${relative(options.cwd, item.path)}`,
    );
    if (options.dryRun) continue;
    if (current !== null) {
      let backup = `${item.path}.a2z-backup`,
        index = 1;
      while (await exists(backup))
        backup = `${item.path}.a2z-backup.${index++}`;
      await writeFile(backup, current, { encoding: "utf8", flag: "wx" });
    }
    await mkdir(dirname(item.path), { recursive: true });
    await writeFile(item.path, item.content, "utf8");
  }
}

async function installDependencies(major, options) {
  if (options.skipInstall || options.dryRun) return;
  const data = await manifest();
  const dependencies = data.dependenciesByTailwind[major];
  const [command, verb] = packageManager();
  const args = [verb, ...dependencies];
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? (process.env.ComSpec ?? "cmd.exe") : command,
    windows
      ? [
          "/d",
          "/s",
          "/c",
          `${command} ${args.map((arg) => `"${arg}"`).join(" ")}`,
        ]
      : args,
    {
      cwd: options.cwd,
      stdio: "inherit",
      windowsVerbatimArguments: windows,
      windowsHide: true,
    },
  );
  if (result.status !== 0)
    throw new Error(
      `Dependency installation failed (${result.error?.message ?? result.status ?? "unknown"})`,
    );
}

async function init(options, quiet = false) {
  const configPath = resolve(options.cwd, "a2z.json");
  if (await exists(configPath)) {
    const config = JSON.parse(await readFile(configPath, "utf8"));
    const tailwind = await detectTailwind(options.cwd);
    if (
      config.tailwindVersion !== tailwind.major &&
      !(tailwind.major === 4 && !config.tailwindVersion)
    )
      throw new Error(
        "This project needs its A2Z styles updated for the installed Tailwind version. Run react-a2z-cli repair first; your components will be preserved.",
      );
    if (!quiet) console.log("React A2Z is already initialized.");
    return config;
  }
  const plan = await setupPlan(options);
  console.log(
    `${options.dryRun ? "Would initialize" : "Initializing"} React A2Z:`,
  );
  await installDependencies(plan.tailwind.major, options);
  await applyPlan(plan, options);
  console.log(
    options.dryRun
      ? "Initialization preview complete; no files were changed."
      : "React A2Z initialized successfully.",
  );
  return plan.config;
}

async function repair(options) {
  const configPath = resolve(options.cwd, "a2z.json");
  if (!(await exists(configPath)))
    throw new Error(
      "This app is not initialized. Run react-a2z-cli init first.",
    );
  const previous = JSON.parse(await readFile(configPath, "utf8"));
  const plan = await setupPlan(options, previous);
  console.log(
    `${options.dryRun ? "Would repair" : "Repairing"} React A2Z styles and setup:`,
  );
  await installDependencies(plan.tailwind.major, options);
  await applyPlan(plan, options);
  console.log(
    options.dryRun
      ? "Repair preview complete; no files were changed."
      : "React A2Z setup repaired. Existing components and helpers were preserved; changed files have .a2z-backup copies. Restart your running dev server to reload the Tailwind configuration.",
  );
}

async function add(name, options) {
  if (!componentNames.includes(name))
    throw new Error(
      `Unknown component: ${name}. Available: ${componentNames.join(", ")}`,
    );
  const sourceRoot = resolve(packageRoot, "registry", name);
  const data = JSON.parse(
    await readFile(resolve(sourceRoot, "manifest.json"), "utf8"),
  );
  const configPath = resolve(options.cwd, "a2z.json");
  const before = (await exists(configPath))
    ? JSON.parse(await readFile(configPath, "utf8"))
    : {
        ...(await defaultPaths(options.cwd)),
        ...(options.componentPath ? { components: options.componentPath } : {}),
      };
  const componentDir = projectPath(options.cwd, before.components);
  const utilsDir = projectPath(options.cwd, before.utils);
  const targets = data.files
    .filter((file) =>
      ["registry:component", "registry:lib"].includes(file.type),
    )
    .map((file) => ({
      ...file,
      path: resolve(
        file.type === "registry:component" ? componentDir : utilsDir,
        basename(file.target),
      ),
    }));
  // Refuse component collisions before auto-init writes any styles/configuration.
  for (const file of targets)
    if (!file.shared && (await exists(file.path)) && !options.overwrite)
      throw new Error(
        `Refusing to overwrite ${relative(options.cwd, file.path)}. Use --overwrite.`,
      );
  for (const file of targets)
    await readFile(resolve(sourceRoot, file.source), "utf8");
  const config = await init(options, true);
  const cn = resolve(projectPath(options.cwd, config.utils), "cn.ts");
  const field = resolve(componentDir, "field.tsx");
  console.log(`${options.dryRun ? "Would add" : "Adding"} ${data.title}:`);
  for (const file of targets) {
    // Shared helpers are consumer-owned after copying, including with --overwrite.
    if (file.shared && (await exists(file.path))) continue;
    const helpers = {
      __A2Z_CN_IMPORT__: cn,
      __A2Z_FIELD_IMPORT__: field,
      __A2Z_STATE_IMPORT__: resolve(utilsDir, "use-controllable-state.ts"),
      __A2Z_COLOR_IMPORT__: resolve(utilsDir, "color.ts"),
      __A2Z_HEX_INPUT_IMPORT__: resolve(utilsDir, "hex-color-input.tsx"),
      __A2Z_CLIPBOARD_IMPORT__: resolve(utilsDir, "copy-to-clipboard.ts"),
    };
    await copy(
      file.source,
      file.path,
      Object.fromEntries(
        Object.entries(helpers).map(([token, target]) => [
          token,
          importPath(file.path, target),
        ]),
      ),
      options,
      sourceRoot,
    );
  }
  console.log(
    options.dryRun
      ? `${data.title} preview complete; no files were changed.`
      : `${data.title} source installed successfully.`,
  );
}

try {
  const { options, positional } = parse(process.argv.slice(2));
  if (options.help || positional.length === 0) {
    usage();
    process.exit(0);
  }
  if (positional[0] === "init") await init(options);
  else if (positional[0] === "repair") await repair(options);
  else if (positional[0] === "add" && positional[1])
    await add(positional[1].toLowerCase(), options);
  else
    throw new Error("Expected: react-a2z-cli init, repair, or add <component>");
} catch (error) {
  console.error(`react-a2z-cli: ${error.message}`);
  process.exit(1);
}
