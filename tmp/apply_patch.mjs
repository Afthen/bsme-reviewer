import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import readline from "node:readline/promises";

const args = process.argv.slice(2);
const dryRun = !args.includes("-y") && !args.includes("--yes");
const fileArg = args.find(a => !a.startsWith("-")) || "tmp/patch.txt";

if (!fs.existsSync(fileArg)) {
  console.error(`File not found: ${fileArg}`);
  process.exit(1);
}

const raw = fs.readFileSync(fileArg, "utf8").replace(/\r\n/g, "\n");

function findFilePath(line) {
  const t = line.trim();
  const filePrefix = t.match(/^FILE:\s*(\S+)/);
  if (filePrefix) return filePrefix[1].replace(/[`*:]/g, "");

  if (t.startsWith("#") || t.startsWith("**") || /^`[^`]+\.[a-zA-Z0-9]+`$/.test(t)) {
    const match = t.match(/`([^`]+\.[a-zA-Z0-9]+)`/);
    if (match) return match[1];
    const match2 = t.match(/(?:^|[\s*#])((?:src|test|styles|app|README|migrate)[^\s*:`]+\.[a-zA-Z0-9]+)/);
    if (match2) return match2[1];
  }
  return null;
}

function parseHunks(diffBlock) {
  const lines = diffBlock.split("\n");
  const hunks = [];
  let state = "idle";
  let search = [];
  let replace = [];

  for (const line of lines) {
    if (state === "idle" && line.trim() === "<<<<") {
      state = "search";
      search = [];
      replace = [];
    } else if (state === "search" && line.trim() === "====") {
      state = "replace";
    } else if (state === "replace" && line.trim() === ">>>>") {
      hunks.push({ search: search.join("\n"), replace: replace.join("\n") });
      state = "idle";
    } else if (state === "search") {
      search.push(line);
    } else if (state === "replace") {
      replace.push(line);
    }
  }
  return hunks;
}

const lines = raw.split("\n");
const operations = [];
let currentFile = null;
let inFence = false;
let fenceMarker = "";
let fenceBuf = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!inFence) {
    const detected = findFilePath(line);
    if (detected) {
      currentFile = detected;
      continue;
    }

    if (line.startsWith("```")) {
      inFence = true;
      fenceMarker = line.startsWith("````") ? "````" : "```";
      fenceBuf = [];
    }
  } else {
    if (line.startsWith(fenceMarker)) {
      inFence = false;
      const content = fenceBuf.join("\n");
      const isDiff = content.includes("<<<<") && content.includes("====") && content.includes(">>>>");
      if (currentFile) {
        operations.push({ file: currentFile, isDiff, content });
      }
      fenceBuf = [];
    } else {
      fenceBuf.push(line);
    }
  }
}

if (operations.length === 0) {
  console.error("No code blocks parsed from patch file. Make sure patch.txt has file headings and code blocks.");
  process.exit(1);
}

const fileMap = new Map();
const originalFileMap = new Map();

function getFile(rel) {
  if (!fileMap.has(rel)) {
    const full = path.resolve(rel);
    const content = fs.existsSync(full) ? fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n") : null;
    fileMap.set(rel, content);
    originalFileMap.set(rel, content);
  }
  return fileMap.get(rel);
}

function findReplaceRanges(str, replace) {
  if (!replace) return [];
  const ranges = [];
  let pos = 0;
  while ((pos = str.indexOf(replace, pos)) !== -1) {
    ranges.push([pos, pos + replace.length]);
    pos += replace.length || 1;
  }
  return ranges;
}

function findOutsideSearchIndices(str, search, replaceRanges) {
  if (!search) return [];
  const indices = [];
  let pos = 0;
  while ((pos = str.indexOf(search, pos)) !== -1) {
    const sStart = pos;
    const sEnd = pos + search.length;
    const isInsideReplace = replaceRanges.some(([rStart, rEnd]) => sStart >= rStart && sEnd <= rEnd);
    if (!isInsideReplace) {
      indices.push(sStart);
    }
    pos += 1;
  }
  return indices;
}

let appliedHunksCount = 0;
let skippedHunksCount = 0;

for (const op of operations) {
  if (op.isDiff) {
    let text = getFile(op.file);
    if (text === null) {
      console.error(`Error: Cannot patch non-existent file: ${op.file}`);
      process.exit(1);
    }
    const hunks = parseHunks(op.content);
    hunks.forEach(({ search, replace }, hunkIdx) => {
      const hunkLabel = hunks.length > 1 ? `Hunk #${hunkIdx + 1}` : "Diff hunk";
      const replaceRanges = findReplaceRanges(text, replace);
      const outsideSearches = findOutsideSearchIndices(text, search, replaceRanges);

      if (outsideSearches.length === 0) {
        if (replaceRanges.length > 0) {
          console.log(`[info] ${hunkLabel} in "${op.file}" already applied, skipping.`);
          skippedHunksCount++;
          return;
        }
        console.error(`Error: Search block not found in "${op.file}":\n---\n${search.slice(0, 160)}...\n---`);
        process.exit(1);
      }

      if (outsideSearches.length > 1) {
        console.error(`Error: Search block matched multiple times in "${op.file}".`);
        process.exit(1);
      }

      const targetIdx = outsideSearches[0];
      text = text.slice(0, targetIdx) + replace + text.slice(targetIdx + search.length);
      appliedHunksCount++;
    });
    fileMap.set(op.file, text);
  } else {
    const current = getFile(op.file);
    const target = op.content.endsWith("\n") ? op.content : op.content + "\n";
    if (current === target) {
      console.log(`[info] File "${op.file}" already up to date, skipping.`);
      skippedHunksCount++;
    } else {
      fileMap.set(op.file, target);
      appliedHunksCount++;
    }
  }
}

const modifiedFiles = [];
for (const [relPath, text] of fileMap.entries()) {
  const original = originalFileMap.get(relPath);
  if (text !== original) {
    modifiedFiles.push(relPath);
  }
}

if (modifiedFiles.length === 0) {
  console.log(`\nAll proposed changes are already applied across ${fileMap.size} file(s). Nothing to do.`);
  process.exit(0);
}

let shouldWrite = !dryRun;

if (dryRun) {
  for (const relPath of fileMap.keys()) {
    if (modifiedFiles.includes(relPath)) {
      console.log(`[dry-run] Would write: ${relPath}`);
    } else {
      console.log(`[dry-run] No changes needed (already applied): ${relPath}`);
    }
  }
  console.log(`\nDry-run successful! (${appliedHunksCount} to apply, ${skippedHunksCount} already applied across ${fileMap.size} files)`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question("Proceed with applying? (y/N): ")).trim().toLowerCase();
  rl.close();
  shouldWrite = ans === "y" || ans === "yes";
  if (!shouldWrite) {
    console.log("Aborted.");
    process.exit(0);
  }
}

for (const relPath of modifiedFiles) {
  const text = fileMap.get(relPath);
  fs.mkdirSync(path.dirname(path.resolve(relPath)), { recursive: true });
  fs.writeFileSync(path.resolve(relPath), text, "utf8");
  console.log(`Updated: ${relPath}`);
}

if (modifiedFiles.some(p => p.startsWith("src/topics/"))) {
  execFileSync(process.execPath, ["scripts/gen_registry.js"], { stdio: "inherit" });
}

console.log(`\nAll changes applied successfully! (${appliedHunksCount} applied, ${skippedHunksCount} skipped across ${modifiedFiles.length} file(s))`);
