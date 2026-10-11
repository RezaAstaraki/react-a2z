import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Pass an extracted npm package directory to verify the shipped files too.
const cli = resolve(
  process.argv[2] ?? resolve(root, "packages/react-a2z-cli"),
  "bin/cli.js",
);
const cwd = await mkdtemp(resolve(tmpdir(), "react-a2z-cli-"));
async function app(directory, major = 4) {
  await mkdir(resolve(directory, "node_modules/tailwindcss"), {
    recursive: true,
  });
  await writeFile(
    resolve(directory, "package.json"),
    JSON.stringify({
      dependencies: { react: "^18", tailwindcss: `^${major}` },
    }),
  );
  await writeFile(
    resolve(directory, "node_modules/tailwindcss/package.json"),
    JSON.stringify({ name: "tailwindcss", version: `${major}.4.17` }),
  );
  await mkdir(resolve(directory, "src/app"), { recursive: true });
  await writeFile(
    resolve(directory, "src/app/globals.css"),
    major === 4
      ? '@import "tailwindcss";\n'
      : "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
  );
}
const invoke = (directory, args, env) =>
  spawnSync(process.execPath, [cli, ...args, "--cwd", directory], {
    cwd: root,
    encoding: "utf8",
    env,
  });
const success = (result) =>
  assert.equal(
    result.status,
    0,
    `${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
  );
async function snapshot(directory) {
  const files = {};
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else files[child.slice(directory.length)] = await readFile(child, "utf8");
    }
  }
  await walk(directory);
  return files;
}
try {
  await app(cwd);
  await mkdir(resolve(cwd, "src/app"), { recursive: true });
  await writeFile(
    resolve(cwd, "src/app/globals.css"),
    '@import "tailwindcss";\n',
    "utf8",
  );
  const result = spawnSync(
    process.execPath,
    [cli, "add", "select", "--cwd", cwd, "--skip-install", "--yes"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    result.status,
    0,
    `${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
  );
  const select = await readFile(
    resolve(cwd, "src/components/ui/select.tsx"),
    "utf8",
  );
  const field = await readFile(
    resolve(cwd, "src/components/ui/field.tsx"),
    "utf8",
  );
  const css = await readFile(resolve(cwd, "src/app/globals.css"), "utf8");
  const config = JSON.parse(await readFile(resolve(cwd, "a2z.json"), "utf8"));
  assert.match(select, /from "\.\/field"/);
  assert.match(select, /from "\.\.\/\.\.\/lib\/react-a2z\/cn"/);
  assert.match(field, /from "\.\.\/\.\.\/lib\/react-a2z\/cn"/);
  assert.doesNotMatch(select, /__A2Z_/);
  assert.doesNotMatch(field, /__A2Z_/);
  assert.match(css, /react-a2z\.css/);
  assert.equal(config.components, "src/components/ui");
  assert.equal(config.css, "src/app/globals.css");
  assert.equal(config.tailwindVersion, 4);
  assert.match(
    await readFile(resolve(cwd, config.styles), "utf8"),
    /@source "\.\.\/components\/ui"/,
  );
  assert.ok(
    css.indexOf('@import "tailwindcss"') < css.indexOf("react-a2z.css"),
  );
  const secondInit = spawnSync(
    process.execPath,
    [cli, "init", "--cwd", cwd, "--skip-install"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(secondInit.status, 0);
  assert.match(secondInit.stdout, /already initialized/);
  const collision = spawnSync(
    process.execPath,
    [cli, "add", "select", "--cwd", cwd, "--skip-install"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(collision.status, 1);
  assert.match(collision.stderr, /Refusing to overwrite/);

  const v3 = resolve(cwd, "v3-app");
  await app(v3, 3);
  const originalConfig =
    'import type { Config } from "tailwindcss";\nimport customPreset from "./custom-preset";\nimport customPlugin from "./custom-plugin";\nconst config: Config = { content: { relative: true, files: ["./existing/**/*.tsx"] }, presets: [customPreset], theme: { extend: { colors: { brand: "#123456" } } }, plugins: [customPlugin] };\nexport default config;\n';
  await writeFile(resolve(v3, "tailwind.config.ts"), originalConfig);
  const beforeDry = await snapshot(v3);
  const dry = invoke(v3, ["add", "select", "--dry-run", "--skip-install"]);
  success(dry);
  assert.match(dry.stdout, /preview complete; no files were changed/);
  assert.doesNotMatch(
    dry.stdout,
    /installed successfully|initialized successfully/,
  );
  assert.deepEqual(await snapshot(v3), beforeDry);
  success(invoke(v3, ["add", "select", "--skip-install"]));
  const v3Config = await readFile(resolve(v3, "tailwind.config.ts"), "utf8");
  assert.match(v3Config, /presets: \[reactA2zPreset, customPreset\]/);
  assert.match(v3Config, /plugins: \[customPlugin\]/);
  assert.match(
    v3Config,
    /"\.\/src\/components\/ui\/\*\*\/\*\.\{js,ts,jsx,tsx\}"/,
  );
  assert.match(v3Config, /"\.\/existing\/\*\*\/\*\.tsx"/);
  assert.match(v3Config, /brand: "#123456"/);
  assert.match(v3Config, /relative: true/);
  assert.equal(
    await readFile(resolve(v3, "tailwind.config.ts.a2z-backup"), "utf8"),
    originalConfig,
  );
  const v3Styles = await readFile(
    resolve(v3, "src/styles/react-a2z.css"),
    "utf8",
  );
  assert.match(v3Styles, /--a2z-primary-600/);
  assert.doesNotMatch(v3Styles, /@theme|@source/);
  const customComponent =
    "// user customization\n" +
    (await readFile(resolve(v3, "src/components/ui/select.tsx"), "utf8"));
  await writeFile(resolve(v3, "src/components/ui/select.tsx"), customComponent);
  const customHelper =
    "// user customization\n" +
    (await readFile(resolve(v3, "src/lib/react-a2z/cn.ts"), "utf8"));
  await writeFile(resolve(v3, "src/lib/react-a2z/cn.ts"), customHelper);
  await writeFile(
    resolve(v3, "src/styles/react-a2z.css"),
    v3Styles + "\n:root { --a2z-primary-600: 1 2 3; }\n",
  );
  success(invoke(v3, ["repair", "--skip-install"]));
  assert.equal(
    await readFile(resolve(v3, "src/components/ui/select.tsx"), "utf8"),
    customComponent,
  );
  assert.equal(
    await readFile(resolve(v3, "src/lib/react-a2z/cn.ts"), "utf8"),
    customHelper,
  );
  assert.match(
    await readFile(resolve(v3, "src/styles/react-a2z.css"), "utf8"),
    /1 2 3/,
  );
  const repaired = await snapshot(v3);
  success(invoke(v3, ["repair", "--skip-install"]));
  assert.deepEqual(await snapshot(v3), repaired);

  // Repair legacy v4 output in a v3 app, leaving user-owned source intact.
  const legacyConfig = JSON.parse(
    await readFile(resolve(v3, "a2z.json"), "utf8"),
  );
  delete legacyConfig.tailwindVersion;
  await writeFile(resolve(v3, "a2z.json"), JSON.stringify(legacyConfig));
  await writeFile(
    resolve(v3, "src/styles/react-a2z.css"),
    await readFile(
      resolve(dirname(cli), "../registry/select/react-a2z.css"),
      "utf8",
    ),
  );
  success(invoke(v3, ["repair", "--skip-install"]));
  assert.doesNotMatch(
    await readFile(resolve(v3, "src/styles/react-a2z.css"), "utf8"),
    /@theme/,
  );
  assert.equal(
    await readFile(resolve(v3, "src/components/ui/select.tsx"), "utf8"),
    customComponent,
  );

  for (const [name, text] of [
    [
      "commonjs",
      'module.exports = { content: ["./old/**/*.tsx",], presets: [], theme: { extend: {} }, plugins: [] };\n',
    ],
    [
      "esm",
      "const config = { content: [], presets: [], theme: { extend: {} }, plugins: [] } satisfies Config; export default config;\n",
    ],
  ]) {
    const directory = resolve(cwd, name);
    await app(directory, 3);
    const filename =
      name === "commonjs" ? "tailwind.config.cjs" : "tailwind.config.ts";
    await writeFile(resolve(directory, filename), text);
    success(invoke(directory, ["init", "--skip-install"]));
    assert.match(
      await readFile(resolve(directory, filename), "utf8"),
      name === "commonjs" ? /require\(/ : /import reactA2zPreset/,
    );
    success(invoke(directory, ["repair", "--skip-install"]));
  }
  const bad = resolve(cwd, "dynamic-app");
  await app(bad, 3);
  await writeFile(
    resolve(bad, "tailwind.config.js"),
    "module.exports = getConfig();\n",
  );
  const beforeBad = await snapshot(bad);
  const badResult = invoke(bad, ["init", "--skip-install"]);
  assert.equal(badResult.status, 1);
  assert.match(badResult.stderr, /Cannot safely edit/);
  assert.deepEqual(await snapshot(bad), beforeBad);
  const nested = resolve(cwd, "nested-config");
  await app(nested, 3);
  await mkdir(resolve(nested, "config"));
  await writeFile(
    resolve(nested, "config/tailwind.config.ts"),
    "export default { content: { relative: true, files: [] }, theme: { extend: {} } };\n",
  );
  success(
    invoke(nested, [
      "init",
      "--tailwind-config",
      "config/tailwind.config.ts",
      "--skip-install",
    ]),
  );
  assert.match(
    await readFile(resolve(nested, "config/tailwind.config.ts"), "utf8"),
    /"\.\.\/src\/components\/ui\/\*\*\/\*\.\{js,ts,jsx,tsx\}"/,
  );
  success(invoke(nested, ["repair", "--skip-install"]));
  for (const text of [
    "module.exports = { content: getContent() };",
    'module.exports = { content: [], prefix: "tw-" };',
    'module.exports = { content: [], important: "#app" };',
  ]) {
    await writeFile(resolve(bad, "tailwind.config.js"), text);
    const before = await snapshot(bad);
    assert.equal(invoke(bad, ["init", "--skip-install"]).status, 1);
    assert.deepEqual(await snapshot(bad), before);
  }
  await writeFile(
    resolve(v3, "src/styles/react-a2z.css"),
    "/* custom styling that must not be discarded */\n",
  );
  const beforeCustom = await snapshot(v3);
  assert.equal(invoke(v3, ["repair", "--skip-install"]).status, 1);
  assert.deepEqual(await snapshot(v3), beforeCustom);
  success(invoke(v3, ["repair", "--overwrite", "--skip-install"]));
  assert.equal(
    await readFile(resolve(v3, "src/components/ui/select.tsx"), "utf8"),
    customComponent,
  );
  for (const [name, packageData, version] of [
    ["missing-tailwind", { dependencies: { react: "^18" } }, "4.0.0"],
    ["missing-react", { devDependencies: { tailwindcss: "^4" } }, "4.0.0"],
    [
      "unsupported",
      { dependencies: { react: "^18", tailwindcss: "^5" } },
      "5.0.0",
    ],
    ["old-v3", { dependencies: { react: "^18", tailwindcss: "^3" } }, "3.3.0"],
  ]) {
    const directory = resolve(cwd, name);
    await app(directory);
    await writeFile(
      resolve(directory, "package.json"),
      JSON.stringify(packageData),
    );
    await writeFile(
      resolve(directory, "node_modules/tailwindcss/package.json"),
      JSON.stringify({ version }),
    );
    const before = await snapshot(directory);
    assert.equal(invoke(directory, ["init", "--skip-install"]).status, 1);
    assert.deepEqual(await snapshot(directory), before);
  }
  success(invoke(cwd, []));

  // Root-layout apps must not acquire an unintended src directory.
  for (const [name, cssName, major] of [
    ["root-next", "app/globals.css", 4],
    ["root-pages", "styles/globals.css", 3],
    ["root-vite", "index.css", 4],
  ]) {
    const directory = resolve(cwd, name);
    await app(directory, major);
    await rm(resolve(directory, "src"), { recursive: true });
    await mkdir(dirname(resolve(directory, cssName)), { recursive: true });
    await writeFile(resolve(directory, cssName), major === 4
      ? '@import "tailwindcss";\n'
      : "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");
    if (major === 3) await writeFile(resolve(directory, "tailwind.config.cjs"),
      "module.exports = { content: [], theme: { extend: {} }, plugins: [] };\n");
    await writeFile(resolve(directory, cssName),
      (await readFile(resolve(directory, cssName), "utf8")) + "\nbody { margin: 0; }\n");
    const before = await snapshot(directory);
    success(invoke(directory, ["add", "select", "--dry-run", "--skip-install"]));
    assert.deepEqual(await snapshot(directory), before);
    success(invoke(directory, ["add", "select", "--skip-install"]));
    const rootConfig = JSON.parse(await readFile(resolve(directory, "a2z.json"), "utf8"));
    assert.equal(rootConfig.components, "components/ui");
    assert.equal(rootConfig.utils, "lib/react-a2z");
    assert.equal(rootConfig.styles, "styles/react-a2z.css");
    assert.equal(rootConfig.css, cssName);
    assert.ok(!(Object.keys(await snapshot(directory)).some(path => /^[/\\]src[/\\]/.test(path))));
    const installed = await snapshot(directory);
    assert.equal(invoke(directory, ["add", "select", "--skip-install"]).status, 1);
    success(invoke(directory, ["repair", "--skip-install"]));
    assert.deepEqual(await snapshot(directory), installed);
  }

  // Exercise actual package-manager spawning without contacting npm or
  // installing dependencies. In particular, Windows uses a .cmd shim.
  const bin = resolve(cwd, "mock-bin");
  const installCwd = resolve(cwd, "install-app");
  await mkdir(bin);
  await mkdir(installCwd);
  await app(installCwd);
  await writeFile(
    resolve(bin, "record.mjs"),
    'import { writeFileSync } from "node:fs";\nwriteFileSync("install-args.txt", process.argv.slice(2).join("\\n"));\n',
    "utf8",
  );
  const manager = resolve(
    bin,
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  );
  await writeFile(
    manager,
    process.platform === "win32"
      ? `@echo off\r\n"${process.execPath}" "%~dp0record.mjs" %*\r\nexit /b %errorlevel%\r\n`
      : '#!/bin/sh\nprintf "%s\\n" "$@" > install-args.txt\n',
    "utf8",
  );
  await chmod(manager, 0o755);
  const env = { ...process.env, npm_config_user_agent: "pnpm/10.0.0" };
  const pathKey =
    Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  env[pathKey] =
    `${bin}${process.platform === "win32" ? ";" : ":"}${env[pathKey] ?? ""}`;
  const install = spawnSync(
    process.execPath,
    [cli, "init", "--cwd", installCwd],
    { cwd: root, encoding: "utf8", env },
  );
  assert.equal(
    install.status,
    0,
    `${install.error ?? ""}\n${install.stdout}\n${install.stderr}`,
  );
  const installArgs = await readFile(
    resolve(installCwd, "install-args.txt"),
    "utf8",
  );
  assert.equal(
    installArgs.trim().split(/\s+/).join(" "),
    "add clsx@^2.1.1 tailwind-merge@^3.0.1",
  );

  // A package-manager error must stop the installer and remain visible.
  await writeFile(
    manager,
    process.platform === "win32"
      ? "@echo off\r\nexit /b 7\r\n"
      : "#!/bin/sh\nexit 7\n",
    "utf8",
  );
  const failedCwd = resolve(cwd, "failed-install-app");
  await mkdir(failedCwd);
  await app(failedCwd);
  const failedInstall = spawnSync(
    process.execPath,
    [cli, "init", "--cwd", failedCwd],
    { cwd: root, encoding: "utf8", env },
  );
  assert.equal(failedInstall.status, 1);
  assert.match(failedInstall.stderr, /Dependency installation failed \(7\)/);
  console.log("CLI integration test passed.");
} finally {
  await rm(cwd, { recursive: true, force: true });
}
