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
    for (const name of ["color-picker", "gradient-maker"]) {
      const added = spawnSync(
        process.execPath,
        [cli, "add", name, "--cwd", app, "--skip-install"],
        { encoding: "utf8", cwd: root, windowsHide: true },
      );
      assert.equal(added.status, 0, `${added.stdout}\n${added.stderr}`);
    }
    // Compile a real consumer of all generated components and their public types.
    await writeFile(
      resolve(app, "usage.tsx"),
      `import { useState } from 'react';
import { Select } from './custom/ui/select';
import { ColorPicker } from './custom/ui/color-picker';
import type { ColorPickerClassNames } from './custom/ui/color-picker';
import { GradientMaker } from './custom/ui/gradient-maker';
import type { GradientValue, GradientPreset, GradientMakerClassNames } from './custom/ui/gradient-maker';
const colors: ColorPickerClassNames = { hexInput: 'rounded-xl', hexError: 'font-medium' };
const gradients: GradientMakerClassNames = { swatchInput: 'cursor-pointer', angleInput: 'accent-primary-600', copyStatus: 'text-sm' };
const presets: GradientPreset[] = [{ name: 'Brand', colors: ['#7c3aed', '#db2777'], angle: 135 }];
export default function Consumer() {
  const [color, setColor] = useState('#7c3aed');
  const [gradient, setGradient] = useState<GradientValue>({ colors: ['#7c3aed', '#db2777'], angle: 90 });
  return <><Select options={[{ value: 'one', label: 'One' }]} />
    <ColorPicker value={color} onChange={setColor} classNames={colors} name='brand' required />
    <ColorPicker defaultValue='#abc' showHex={false} disabled />
    <GradientMaker value={gradient} onValueChange={setGradient} presets={presets} classNames={gradients} onGradientChange={(css: string) => console.log(css)} />
    <GradientMaker defaultValue={gradient} disabled showCopy={false} /></>;
}
`,
    );
    const consumer = spawnSync(
      process.execPath,
      [
        resolve(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--skipLibCheck",
        "--strict",
        "--noUnusedLocals",
        "--target",
        major === 3 ? "ES5" : "ES2020",
        "--lib",
        "dom,dom.iterable,esnext",
        "--jsx",
        "react-jsx",
        "--esModuleInterop",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
        resolve(app, "usage.tsx"),
      ],
      { encoding: "utf8", windowsHide: true },
    );
    assert.equal(consumer.status, 0, `${consumer.stdout}\n${consumer.stderr}`);
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
    assert.match(result.css, /cursor:\s*text/);
    assert.match(result.css, /\.accent-primary-600/);
    assert.match(result.css, /danger-600/);
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
      `Tailwind v${major}: Select, ColorPicker, and GradientMaker source typechecked and styles compiled, including custom paths and shared helpers.`,
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
