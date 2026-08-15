/**
 * Rebuild public/models GLBs with Blender (high-detail kit).
 *
 *   node ./scripts/build-blender-lib.mjs
 *   node ./scripts/build-blender-lib.mjs --only hex-table
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "scripts", "blender", "export_kit.py");

const candidates = [
  process.env.BLENDER_PATH,
  "D:\\03_DCMvn\\tools\\blender-4.5.10\\blender.exe",
  "D:\\03_DCMvn\\tools\\blender-4.5.10\\blender-4.5.10-windows-x64\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
].filter(Boolean);

function findBlender() {
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return "blender";
}

const blender = findBlender();
const extra = process.argv.slice(2);
const args = ["--background", "--python", script, "--", "--out", join(root, "public", "models"), ...extra];

console.log(`Blender: ${blender}`);
const result = spawnSync(blender, args, { stdio: "inherit", windowsHide: true });
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
