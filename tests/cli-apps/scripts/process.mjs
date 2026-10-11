import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const cli = resolve(root, "node_modules/react-a2z-cli/bin/cli.js");
export function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, {
    cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit",
    windowsHide: true,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", CI: "true" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}
export function npm(args, cwd = root, capture = false) {
  if (!process.env.npm_execpath) throw new Error("Run this script through npm run so npm_execpath is available.");
  return run(process.execPath, [process.env.npm_execpath, ...args], cwd, capture);
}
