import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import preset from "../tailwind.preset.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "packages/react-a2z-cli/registry/select");
const read = (path) => readFile(resolve(root, path), "utf8");

function replaceOnce(source, search, replacement, file) {
  if (!source.includes(search))
    throw new Error(`Expected text missing in ${file}: ${search}`);
  return source.replace(search, replacement);
}

await mkdir(output, { recursive: true });
let select = await read("src/components/Select/Select.tsx");
select = replaceOnce(
  select,
  'from "../../utils"',
  'from "__A2Z_CN_IMPORT__"',
  "select.tsx",
);
select = replaceOnce(
  select,
  'from "../shared/field"',
  'from "__A2Z_FIELD_IMPORT__"',
  "select.tsx",
);
let field = await read("src/components/shared/field.tsx");
field = replaceOnce(
  field,
  'from "../../utils"',
  'from "__A2Z_CN_IMPORT__"',
  "field.tsx",
);
let cn = await read("src/utils/cn.tsx");
cn = replaceOnce(cn, "from './extend-merge'", 'from "./extend-merge"', "cn.ts");
const extendMerge = await read("src/utils/extend-merge.ts");
const tokens = await read("tokens.css");
const tailwind = await read("tailwind.css");
const themeStart = tailwind.indexOf("@theme inline {");
if (themeStart < 0)
  throw new Error("Could not find @theme inline in tailwind.css");
const files = {
  "select.tsx.template": select,
  "field.tsx.template": field,
  "cn.ts": cn,
  "extend-merge.ts": extendMerge,
  "react-a2z.css": `${tokens.trim()}\n\n${tailwind.slice(themeStart).trim()}\n`,
  "react-a2z.v3.css": `${tokens.trim()}\n`,
  "tailwind.preset.cjs": `// Generated from React A2Z's token mapping.\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`,
  "tailwind.preset.d.cts":
    'declare const preset: Omit<import("tailwindcss").Config, "content">;\nexport = preset;\n',
};
for (const [name, content] of Object.entries(files))
  await writeFile(resolve(output, name), content, "utf8");
const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "select",
  type: "registry:component",
  title: "React A2Z Select",
  description:
    "Accessible styled select with native form semantics and an optional custom popup.",
  dependencies: ["clsx@^2.1.1", "tailwind-merge@^3.0.1"],
  dependenciesByTailwind: {
    3: ["clsx@^2.1.1", "tailwind-merge@^2.6.0"],
    4: ["clsx@^2.1.1", "tailwind-merge@^3.0.1"],
  },
  files: [
    {
      source: "select.tsx.template",
      target: "src/components/ui/select.tsx",
      type: "registry:component",
    },
    {
      source: "field.tsx.template",
      target: "src/components/ui/field.tsx",
      type: "registry:component",
    },
    {
      source: "cn.ts",
      target: "src/lib/react-a2z/cn.ts",
      type: "registry:lib",
      shared: true,
    },
    {
      source: "extend-merge.ts",
      target: "src/lib/react-a2z/extend-merge.ts",
      type: "registry:lib",
      shared: true,
    },
    {
      source: "react-a2z.css",
      target: "src/styles/react-a2z.css",
      type: "registry:style",
    },
  ],
};
await writeFile(
  resolve(output, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
const colorHelpers = {
  "color.ts": await read("src/utils/color.ts"),
  "use-controllable-state.ts": await read("src/hooks/useControllableState.ts"),
  "hex-color-input.tsx.template": replaceOnce(
    await read("src/components/ColorPicker/HexColorInput.tsx"),
    'from "../../utils"',
    'from "__A2Z_COLOR_IMPORT__"',
    "HexColorInput.tsx",
  ),
};
const components = [
  {
    name: "color-picker",
    title: "ColorPicker",
    description:
      "Native color picking, validated HEX editing, presets, and fully customizable styling slots.",
    source: "ColorPicker.tsx",
    utils:
      'import { cn } from "__A2Z_CN_IMPORT__";\nimport { normalizeHex } from "__A2Z_COLOR_IMPORT__";',
  },
  {
    name: "gradient-maker",
    title: "GradientMaker",
    description:
      "Editable gradient stops with add/remove/reorder controls, presets, validated HEX editing, and CSS copying.",
    source: "GradientMaker.tsx",
    utils:
      'import { cn } from "__A2Z_CN_IMPORT__";\nimport { normalizeHex } from "__A2Z_COLOR_IMPORT__";\nimport { copyToClipboard } from "__A2Z_CLIPBOARD_IMPORT__";',
  },
];
for (const component of components) {
  const directory = resolve(output, "..", component.name);
  await mkdir(directory, { recursive: true });
  let source = await read(`src/components/ColorPicker/${component.source}`);
  source = replaceOnce(
    source,
    component.name === "color-picker"
      ? 'import { cn, normalizeHex } from "../../utils";'
      : 'import { cn, copyToClipboard, normalizeHex } from "../../utils";',
    component.utils,
    component.source,
  );
  source = replaceOnce(
    source,
    'from "../../hooks"',
    'from "__A2Z_STATE_IMPORT__"',
    component.source,
  );
  source = replaceOnce(
    source,
    'from "./HexColorInput"',
    'from "__A2Z_HEX_INPUT_IMPORT__"',
    component.source,
  );
  source += `\nexport { ${component.title} };\n`;
  const generated = {
    [`${component.name}.tsx.template`]: source,
    ...colorHelpers,
    ...(component.name === "gradient-maker"
      ? { "copy-to-clipboard.ts": await read("src/utils/copyToClipboard.ts") }
      : {}),
  };
  const componentFiles = Object.keys(generated).map((filename) => ({
    source: filename,
    target:
      filename === `${component.name}.tsx.template`
        ? `src/components/ui/${component.name}.tsx`
        : `src/lib/react-a2z/${filename.replace(/\.template$/, "")}`,
    type:
      filename === `${component.name}.tsx.template`
        ? "registry:component"
        : "registry:lib",
    ...(filename === `${component.name}.tsx.template` ? {} : { shared: true }),
  }));
  for (const [filename, content] of Object.entries(generated))
    await writeFile(resolve(directory, filename), content, "utf8");
  await writeFile(
    resolve(directory, "manifest.json"),
    `${JSON.stringify(
      {
        ...manifest,
        name: component.name,
        title: `React A2Z ${component.title}`,
        description: component.description,
        files: componentFiles,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}
await writeFile(
  resolve(output, "../components.json"),
  `${JSON.stringify(["select", ...components.map((c) => c.name)], null, 2)}\n`,
  "utf8",
);
console.log(
  "Built Select, ColorPicker, and GradientMaker registries from library source.",
);
