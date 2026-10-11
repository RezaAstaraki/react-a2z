import { readFile, access } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, relative, dirname, sep } from "node:path";
import { parse } from "@babel/parser";

export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export function projectPath(cwd, value) {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Invalid path in a2z.json.");
  const target = resolve(cwd, value);
  const path = relative(cwd, target);
  if (
    !path ||
    path === ".." ||
    path.startsWith(`..${sep}`) ||
    resolve(cwd, path) !== target ||
    /^[A-Za-z]:/.test(path)
  )
    throw new Error(`Path must stay inside the app: ${value}`);
  return target;
}

export function relativeImport(from, to) {
  const path = relative(dirname(from), to).split(sep).join("/");
  return path.startsWith(".") ? path : `./${path}`;
}

export async function detectTailwind(cwd) {
  const packagePath = resolve(cwd, "package.json");
  if (!(await exists(packagePath)))
    throw new Error(
      "Run this command in an existing React app with Tailwind CSS installed (package.json is missing).",
    );
  const pkg = JSON.parse(await readFile(packagePath, "utf8"));
  const deps = {
    ...pkg.peerDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
  if (!deps.react)
    throw new Error(
      "React is missing from this project's package.json. Create a React app before adding components.",
    );
  if (!deps.tailwindcss)
    throw new Error(
      "Tailwind CSS is missing from package.json. Configure Tailwind v3.4+ or v4 before adding components.",
    );
  let installed;
  try {
    installed = createRequire(packagePath).resolve("tailwindcss/package.json");
  } catch {
    throw new Error(
      "Tailwind CSS is declared but not installed. Install this project's dependencies, then retry.",
    );
  }
  const { version } = JSON.parse(await readFile(installed, "utf8"));
  const [major, minor, patch] = version.split(".").map(Number);
  if (major !== 3 && major !== 4)
    throw new Error(`Unsupported Tailwind CSS ${version}. Use v3.4+ or v4.`);
  if (major === 3 && (minor < 4 || (minor === 4 && patch < 1)))
    throw new Error(
      `Tailwind CSS ${version} is too old for these components. Update within v3 to at least 3.4.1, or configure v4, then retry.`,
    );
  return { major, version };
}

const unwrap = (node) => {
  while (
    node &&
    [
      "TSAsExpression",
      "TSSatisfiesExpression",
      "TypeCastExpression",
      "TSNonNullExpression",
      "ParenthesizedExpression",
    ].includes(node.type)
  )
    node = node.expression;
  return node;
};
const keyOf = (property) =>
  !property.computed && (property.key?.name ?? property.key?.value);

// Only edit a statically identifiable exported object. Never execute app config.
export function configureV3(
  source,
  filename,
  presetPath,
  contentPaths,
  relativeContentPaths = contentPaths,
) {
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: ["typescript"],
  });
  const bindings = new Map();
  for (const statement of ast.program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration"
        ? statement.declaration
        : statement;
    if (declaration?.type === "VariableDeclaration")
      for (const item of declaration.declarations)
        if (item.id.type === "Identifier")
          bindings.set(item.id.name, item.init);
  }
  let object,
    commonjs = false;
  for (const statement of ast.program.body) {
    let value;
    if (statement.type === "ExportDefaultDeclaration")
      value = statement.declaration;
    const expression = statement.expression;
    if (
      expression?.type === "AssignmentExpression" &&
      expression.operator === "=" &&
      expression.left.type === "MemberExpression" &&
      !expression.left.computed &&
      expression.left.object.name === "module" &&
      expression.left.property.name === "exports"
    ) {
      value = expression.right;
      commonjs = true;
    }
    const visited = new Set();
    value = unwrap(value);
    while (value?.type === "Identifier" && !visited.has(value.name)) {
      visited.add(value.name);
      value = unwrap(bindings.get(value.name));
    }
    if (value?.type === "ObjectExpression") object = value;
  }
  if (
    !object ||
    object.properties.some(
      (property) => property.type !== "ObjectProperty" || property.computed,
    )
  )
    throw new Error(
      `Cannot safely edit ${filename}: use an exported config object with explicit properties. No files were changed.`,
    );
  for (const name of ["presets", "content", "prefix", "important"]) {
    const properties = object.properties.filter(
      (property) => keyOf(property) === name,
    );
    if (properties.length > 1)
      throw new Error(
        `Cannot safely edit duplicate ${name} settings in ${filename}.`,
      );
  }
  const property = (name) =>
    object.properties.find((entry) => keyOf(entry) === name);
  if (property("prefix") && property("prefix").value.value !== "")
    throw new Error(
      `Tailwind prefixes in ${filename} need manual component-class customization. No files were changed.`,
    );
  if (
    property("important") &&
    typeof property("important").value.value === "string"
  )
    throw new Error(
      `Selector-scoped important in ${filename} excludes portaled components. Use boolean important instead. No files were changed.`,
    );
  let binding = "reactA2zPreset",
    declaration = "";
  const existingImport = ast.program.body.find(
    (entry) =>
      entry.type === "ImportDeclaration" && entry.source.value === presetPath,
  );
  const existingRequire = [...bindings.entries()].find(
    ([, value]) =>
      value?.type === "CallExpression" &&
      value.callee.name === "require" &&
      value.arguments[0]?.value === presetPath,
  );
  if (existingImport) {
    binding = existingImport.specifiers.find(
      (entry) => entry.type === "ImportDefaultSpecifier",
    )?.local.name;
    if (!binding)
      throw new Error(
        `Use a default import for the A2Z preset in ${filename}.`,
      );
  } else if (existingRequire) binding = existingRequire[0];
  else {
    let counter = 1;
    while (new RegExp(`\\b${binding}\\b`).test(source))
      binding = `reactA2zPreset${counter++}`;
    declaration = commonjs
      ? `const ${binding} = require(${JSON.stringify(presetPath)});\n`
      : `import ${binding} from ${JSON.stringify(presetPath)};\n`;
  }
  const edits = [],
    additions = [];
  function extendArray(node, values) {
    if (node?.type !== "ArrayExpression")
      throw new Error(
        `Cannot safely edit a dynamic presets/content array in ${filename}. No files were changed.`,
      );
    const missing = values.filter(
      (value) =>
        !node.elements.some((entry) =>
          value.identifier
            ? entry?.name === value.text
            : entry?.value === value.text,
        ),
    );
    if (!missing.length) return;
    const text = missing
      .map((value) =>
        value.identifier ? value.text : JSON.stringify(value.text),
      )
      .join(", ");
    // Insert immediately after [, preserving trailing commas and comments.
    edits.push({
      start: node.start + 1,
      end: node.start + 1,
      text: `${text}${node.elements.length ? ", " : ""}`,
    });
  }
  const presets = property("presets");
  if (presets)
    extendArray(presets.value, [{ text: binding, identifier: true }]);
  else additions.push(`presets: [${binding}]`);
  const content = property("content");
  if (!content) additions.push(`content: ${JSON.stringify(contentPaths)}`);
  else if (content.value.type === "ObjectExpression") {
    if (
      content.value.properties.some(
        (entry) => entry.type !== "ObjectProperty" || entry.computed,
      )
    )
      throw new Error(
        `Cannot safely edit dynamic content settings in ${filename}.`,
      );
    const files = content.value.properties.find(
      (entry) => keyOf(entry) === "files",
    );
    if (!files) throw new Error(`Missing content.files in ${filename}.`);
    const relativeSetting = content.value.properties.find(
      (entry) => keyOf(entry) === "relative",
    );
    if (relativeSetting && relativeSetting.value.type !== "BooleanLiteral")
      throw new Error(
        `Cannot safely edit dynamic content.relative in ${filename}.`,
      );
    const paths = relativeSetting?.value.value
      ? relativeContentPaths
      : contentPaths;
    extendArray(
      files.value,
      paths.map((text) => ({ text })),
    );
  } else
    extendArray(
      content.value,
      contentPaths.map((text) => ({ text })),
    );
  if (additions.length)
    edits.push({
      start: object.start + 1,
      end: object.start + 1,
      text: `\n  ${additions.join(",\n  ")}${object.properties.length ? "," : ""}\n`,
    });
  if (declaration) {
    const offset =
      ast.program.directives.at(-1)?.end ?? ast.program.interpreter?.end ?? 0;
    edits.push({
      start: offset,
      end: offset,
      text: `${offset ? "\n" : ""}${declaration}`,
    });
  }
  let result = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return result;
}

export async function findV3Config(cwd, configured) {
  if (configured) {
    const path = projectPath(cwd, configured);
    if (!(await exists(path)))
      throw new Error(`Tailwind config does not exist: ${configured}`);
    return path;
  }
  const found = [];
  for (const name of [
    "tailwind.config.ts",
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.cts",
    "tailwind.config.mts",
  ])
    if (await exists(resolve(cwd, name))) found.push(resolve(cwd, name));
  if (found.length !== 1)
    throw new Error(
      "Expected one Tailwind v3 config. Use --tailwind-config <path> to select your existing config.",
    );
  return found[0];
}
