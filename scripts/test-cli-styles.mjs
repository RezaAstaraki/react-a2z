import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  symlink,
  rm,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import postcss from "postcss";
import tailwindV3 from "tailwindcss";
import tailwindV4 from "@tailwindcss/postcss";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const v4Require = createRequire(require.resolve("@tailwindcss/postcss"));
const cli = resolve(
  process.argv[2] ?? resolve(root, "packages/react-a2z-cli"),
  "bin/cli.js",
);
await mkdir(resolve(root, ".release-tmp"), { recursive: true });
const temp = await mkdtemp(resolve(root, ".release-tmp/cli-styles-"));
try {
  for (const major of [3, 4]) {
    const app = resolve(temp, `v${major}`);
    await mkdir(resolve(app, "node_modules"), { recursive: true });
    const tailwindRoot = dirname(
      (major === 3 ? require : v4Require).resolve("tailwindcss/package.json"),
    );
    await symlink(
      tailwindRoot,
      resolve(app, "node_modules/tailwindcss"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await writeFile(
      resolve(app, "package.json"),
      JSON.stringify({
        dependencies: { react: "^18", tailwindcss: `^${major}` },
      }),
    );
    await mkdir(resolve(app, "src/app"), { recursive: true });
    const globalCss =
      major === 3
        ? "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n"
        : '@import "tailwindcss";\n';
    await writeFile(resolve(app, "src/app/globals.css"), globalCss);
    if (major === 3)
      await writeFile(
        resolve(app, "tailwind.config.ts"),
        'import type { Config } from "tailwindcss";\nconst config: Config = { content: [], theme: { extend: { colors: { brand: "#123456" } } }, plugins: [] };\nexport default config;\n',
      );
    const installed = spawnSync(
      process.execPath,
      [
        cli,
        "add",
        "select",
        "--cwd",
        app,
        "--path",
        "custom/ui",
        "--skip-install",
      ],
      { encoding: "utf8", cwd: root },
    );
    assert.equal(
      installed.status,
      0,
      `${installed.error ?? ""}\n${installed.stdout}\n${installed.stderr}`,
    );
    const cssPath = resolve(app, "src/app/globals.css");
    const generated = await readFile(
      resolve(app, "src/styles/react-a2z.css"),
      "utf8",
    );
    const input =
      major === 3 ? generated + globalCss : await readFile(cssPath, "utf8");
    const plugin =
      major === 3
        ? tailwindV3(resolve(app, "tailwind.config.ts"))
        : tailwindV4({ base: app, optimize: false });
    const previousCwd = process.cwd();
    let result;
    try {
      process.chdir(app);
      result = await postcss([plugin]).process(input, { from: cssPath });
    } finally {
      process.chdir(previousCwd);
    }
    assert.match(result.css, /\.bg-surface\s*\{/);
    assert.match(result.css, /\.text-fg\s*\{/);
    assert.match(result.css, /\.border-border\s*\{/);
    assert.match(result.css, /var\(--a2z-surface\)/);
    assert.match(result.css, /var\(--a2z-fg\)/);
    assert.match(result.css, /primary-500/);
    assert.match(result.css, /cursor:\s*pointer/);
    if (major === 3) {
      const loadConfig = require("tailwindcss/loadConfig");
      const config = loadConfig(resolve(app, "tailwind.config.ts"));
      assert.equal(config.theme.extend.colors.brand, "#123456");
      assert.equal(
        config.presets[0].theme.extend.colors.surface.DEFAULT,
        "rgb(var(--a2z-surface) / <alpha-value>)",
      );
      const checked = spawnSync(
        process.execPath,
        [
          resolve(root, "node_modules/typescript/bin/tsc"),
          "--noEmit",
          "--skipLibCheck",
          "--strict",
          "--esModuleInterop",
          "--module",
          "Node16",
          "--moduleResolution",
          "Node16",
          resolve(app, "tailwind.config.ts"),
        ],
        { encoding: "utf8" },
      );
      assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    }
    console.log(
      `Tailwind v${major}: generated Select styles compiled, including custom component paths and theme tokens.`,
    );
  }
} finally {
  if (
    !temp.startsWith(
      resolve(root, ".release-tmp") +
        (process.platform === "win32" ? "\\" : "/"),
    )
  )
    throw new Error("Unexpected fixture cleanup path.");
  await rm(temp, { recursive: true, force: true });
}
