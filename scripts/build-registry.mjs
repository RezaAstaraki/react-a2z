import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
    },
    {
      source: "extend-merge.ts",
      target: "src/lib/react-a2z/extend-merge.ts",
      type: "registry:lib",
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
console.log(`Built Select registry in ${output}`);
