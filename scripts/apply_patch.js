/**
 * scripts/apply_patch.js
 * CLI entry point for applying FILE:/diff/subst patch bundles (default: tmp/patch.txt).
 * Supports --dry-run (exit without writing) and -y / --yes (write without prompt).
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { applyPatch } from "./lib/patch_apply.js";

const args = process.argv.slice(2);
const autoYes = args.includes("-y") || args.includes("--yes");
const dryOnly = args.includes("--dry-run");
const fileArg = args.find(a => !a.startsWith("-")) || "tmp/patch.txt";

if (!fs.existsSync(fileArg)) {
  console.error(`File not found: ${fileArg}`);
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(fileArg), "utf8");

let preview;
try {
  preview = applyPatch(raw, { root: process.cwd(), dryRun: true });
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

for (const line of preview.logs) {
  console.log(line);
}

if (preview.modifiedFiles.length === 0) {
  console.log(`\nAll proposed changes are already applied across ${preview.touchedFiles.length} file(s). Nothing to do.`);
  process.exit(0);
}

if (!autoYes) {
  for (const relPath of preview.touchedFiles) {
    if (preview.modifiedFiles.includes(relPath)) {
      console.log(`[dry-run] Would write: ${relPath}`);
    } else {
      console.log(`[dry-run] No changes needed (already applied): ${relPath}`);
    }
  }
  console.log(
    `\nDry-run successful! (${preview.appliedCount} operation(s) to apply, ${preview.skippedCount} already applied across ${preview.touchedFiles.length} file(s))`
  );

  if (dryOnly) {
    process.exit(0);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question("Proceed with applying? (y/N): ")).trim().toLowerCase();
  rl.close();
  if (ans !== "y" && ans !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }
}

try {
  const res = applyPatch(raw, { root: process.cwd(), dryRun: false });
  for (const relPath of res.modifiedFiles) {
    console.log(`Updated: ${relPath}`);
  }
  console.log(
    `\nAll changes applied successfully! (${res.appliedCount} applied, ${res.skippedCount} skipped across ${res.modifiedFiles.length} file(s))`
  );
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
