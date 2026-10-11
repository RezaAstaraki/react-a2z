import { resolve } from "node:path";
import { npm, root } from "./process.mjs";
// CRA's TypeScript 4 peer requirement is isolated from the modern workspaces.
npm(["install", "--no-audit", "--no-fund"], resolve(root, "apps/cra-src-tw3"));
