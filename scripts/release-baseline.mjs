import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import semver from "semver";
import {
  root,
  readJson,
  temporaryWork,
  packAndExtract,
  contractFor,
} from "./release-tools.mjs";

const config = await readJson(resolve(root, "release.config.json"));
const version = process.argv[2] ?? config.baselineVersion;
if (!semver.valid(version))
  throw new Error(
    "Use an exact published version, e.g. npm run release:baseline -- 1.1.0.",
  );
const folder = resolve(root, "release/baselines", version);
try {
  await access(folder);
  throw new Error(
    `Baseline ${version} already exists. Published baselines are not overwritten.`,
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await temporaryWork(async (temp) => {
  const packed = await packAndExtract(`react-a2z@${version}`, temp);
  const pkg = await readJson(resolve(packed.packageRoot, "package.json"));
  if (pkg.name !== "react-a2z" || pkg.version !== version)
    throw new Error("Registry returned an unexpected package.");
  const contract = await contractFor(packed.packageRoot, resolve(temp, "api"));
  await mkdir(folder, { recursive: true });
  await writeFile(
    resolve(folder, "contract.json"),
    JSON.stringify(
      {
        package: pkg.name,
        version,
        registry: "https://registry.npmjs.org",
        integrity: packed.integrity,
        contract,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(resolve(folder, "react-a2z.api.md"), contract.api);
  console.log(`Saved published ${pkg.name}@${version} baseline in ${folder}`);
});
