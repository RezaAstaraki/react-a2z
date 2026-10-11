import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cwd = await mkdtemp(resolve(tmpdir(), "react-a2z-cli-"));
try {
  await mkdir(resolve(cwd, "src/app"), { recursive: true });
  await writeFile(
    resolve(cwd, "src/app/globals.css"),
    '@import "tailwindcss";\n',
    "utf8",
  );
  const result = spawnSync(
    process.execPath,
    [
      "packages/react-a2z-cli/bin/cli.js",
      "add",
      "select",
      "--cwd",
      cwd,
      "--skip-install",
      "--yes",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
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
  const secondInit = spawnSync(
    process.execPath,
    [
      "packages/react-a2z-cli/bin/cli.js",
      "init",
      "--cwd",
      cwd,
      "--skip-install",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(secondInit.status, 0);
  assert.match(secondInit.stdout, /already initialized/);
  const collision = spawnSync(
    process.execPath,
    [
      "packages/react-a2z-cli/bin/cli.js",
      "add",
      "select",
      "--cwd",
      cwd,
      "--skip-install",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(collision.status, 1);
  assert.match(collision.stderr, /Refusing to overwrite/);
  console.log("CLI integration test passed.");
} finally {
  await rm(cwd, { recursive: true, force: true });
}
