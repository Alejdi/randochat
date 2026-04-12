// Patches a regression in Next 15.5.x where `config.generateBuildId`
// is stripped from the loaded config, causing `next build` to crash with
// "TypeError: generate is not a function". We harden the helper so a
// missing function falls back to the provided `fallback` (nanoid).
//
// Safe to run repeatedly: the patch is idempotent.

const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "build",
  "generate-build-id.js"
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const src = fs.readFileSync(target, "utf8");
const needle = "let buildId = await generate();";
const replacement =
  "let buildId = typeof generate === 'function' ? await generate() : null;";

if (src.includes(replacement)) {
  console.log("[patch-next] already patched");
  process.exit(0);
}

if (!src.includes(needle)) {
  console.warn("[patch-next] expected pattern not found, skipping");
  process.exit(0);
}

fs.writeFileSync(target, src.replace(needle, replacement));
console.log("[patch-next] applied generate-build-id fix");
