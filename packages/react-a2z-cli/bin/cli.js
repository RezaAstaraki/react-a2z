#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryRoot = resolve(packageRoot, "registry", "select");
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
  react-a2z init [--cwd path] [--path path] [--overwrite] [--skip-install] [--dry-run]
  react-a2z add select [--cwd path] [--overwrite] [--skip-install] [--dry-run]`);

function parse(argv) {
  const options = { cwd: process.cwd() };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--cwd" || arg === "--path") {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === "--cwd") options.cwd = resolve(value);
      else options.componentPath = value;
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
  ])
    if (await exists(resolve(cwd, path))) return path;
  return null;
}

async function copy(source, target, replacements, options) {
  if ((await exists(target)) && !options.overwrite)
    throw new Error(
      `Refusing to overwrite ${relative(options.cwd, target)}. Use --overwrite.`,
    );
  console.log(`  ${relative(options.cwd, target)}`);
  if (options.dryRun) return;
  await mkdir(dirname(target), { recursive: true });
  let content = await readFile(resolve(registryRoot, source), "utf8");
  for (const [from, to] of Object.entries(replacements))
    content = content.replaceAll(from, to);
  await writeFile(target, content, "utf8");
}

async function init(options, quiet = false) {
  const configPath = resolve(options.cwd, "a2z.json");
  if (await exists(configPath)) {
    if (!quiet) console.log("React A2Z is already initialized.");
    return JSON.parse(await readFile(configPath, "utf8"));
  }
  const config = {
    components: options.componentPath ?? "src/components/ui",
    utils: "src/lib/react-a2z",
    styles: "src/styles/react-a2z.css",
    css: await detectCss(options.cwd),
  };
  const cn = resolve(options.cwd, config.utils, "cn.ts");
  const merge = resolve(options.cwd, config.utils, "extend-merge.ts");
  const styles = resolve(options.cwd, config.styles);
  console.log(
    `${options.dryRun ? "Would initialize" : "Initializing"} React A2Z:`,
  );
  await copy("cn.ts", cn, {}, options);
  await copy("extend-merge.ts", merge, {}, options);
  await copy("react-a2z.css", styles, {}, options);
  if (config.css) {
    const css = resolve(options.cwd, config.css);
    const statement = `@import "${importPath(css, styles).replace(/\.css$/, ".css")}";`;
    const current = await readFile(css, "utf8");
    if (!options.dryRun && !current.includes(statement))
      await writeFile(css, `${statement}\n${current}`, "utf8");
    console.log(
      `  ${options.dryRun ? "would update" : "updated"} ${config.css}`,
    );
  } else console.log(`  Import ${config.styles} from your global stylesheet.`);
  console.log("  a2z.json");
  if (!options.dryRun)
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  if (!options.skipInstall && !options.dryRun) {
    const data = await manifest();
    const [command, verb] = packageManager();
    const result = spawnSync(command, [verb, ...data.dependencies], {
      cwd: options.cwd,
      stdio: "inherit",
    });
    if (result.status !== 0)
      throw new Error(
        `Dependency installation failed (${result.status ?? "unknown"})`,
      );
  }
  console.log("React A2Z initialized successfully.");
  return config;
}

async function add(name, options) {
  if (name !== "select")
    throw new Error(`Unknown component: ${name}. Available: select`);
  const config = await init(options, true);
  const componentDir = resolve(options.cwd, config.components);
  const cn = resolve(options.cwd, config.utils, "cn.ts");
  const field = resolve(componentDir, "field.tsx");
  const select = resolve(componentDir, "select.tsx");
  console.log(`${options.dryRun ? "Would add" : "Adding"} React A2Z Select:`);
  await copy(
    "field.tsx.template",
    field,
    { __A2Z_CN_IMPORT__: importPath(field, cn) },
    options,
  );
  await copy(
    "select.tsx.template",
    select,
    {
      __A2Z_CN_IMPORT__: importPath(select, cn),
      __A2Z_FIELD_IMPORT__: importPath(select, field),
    },
    options,
  );
  console.log("Select source installed successfully.");
}

try {
  const { options, positional } = parse(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }
  if (positional[0] === "init") await init(options);
  else if (positional[0] === "add" && positional[1])
    await add(positional[1].toLowerCase(), options);
  else throw new Error("Expected: react-a2z init or react-a2z add <component>");
} catch (error) {
  console.error(`react-a2z: ${error.message}`);
  process.exit(1);
}
