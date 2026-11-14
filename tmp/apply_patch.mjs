cat << 'EOF' > tmp/apply_patch.mjs
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find(a => !a.startsWith("-")) || "tmp/patch.txt";

if (!fs.existsSync(fileArg)) {
  console.error(`File not found: ${fileArg}`);
  process.exit(1);
}

const raw = fs.readFileSync(fileArg, "utf8").replace(/\r\n/g, "\n");

// Look for file headers like "FILE: path/to/file", "#### 1. `path/to/file`", or "**`path/to/file`**"
function findFilePath(line) {
  const t = line.trim();
  const filePrefix = t.match(/^FILE:\s*(\S+)/);
  if (filePrefix) return filePrefix[1].replace(/[`*:]/g, "");

  if (t.startsWith("#") || t.startsWith("**")) {
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

// In-memory application & validation
const fileMap = new Map();
function getFile(rel) {
  if (!fileMap.has(rel)) {
    const full = path.resolve(rel);
    fileMap.set(rel, fs.existsSync(full) ? fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n") : null);
  }
  return fileMap.get(rel);
}

for (const op of operations) {
  if (op.isDiff) {
    let text = getFile(op.file);
    if (text === null) {
      console.error(`Error: Cannot patch non-existent file: ${op.file}`);
      process.exit(1);
    }
    const hunks = parseHunks(op.content);
    for (const { search, replace } of hunks) {
      if (!text.includes(search)) {
        console.error(`Error: Search block not found in "${op.file}":\n---\n${search.slice(0, 160)}...\n---`);
        process.exit(1);
      }
      const firstIdx = text.indexOf(search);
      const lastIdx = text.lastIndexOf(search);
      if (firstIdx !== lastIdx) {
        console.error(`Error: Search block matched multiple times in "${op.file}".`);
        process.exit(1);
      }
      text = text.slice(0, firstIdx) + replace + text.slice(firstIdx + search.length);
    }
    fileMap.set(op.file, text);
  } else {
    // Drop-in replacement
    fileMap.set(op.file, op.content.endsWith("\n") ? op.content : op.content + "\n");
  }
}

for (const [relPath, text] of fileMap.entries()) {
  if (dryRun) {
    console.log(`[dry-run] Would write: ${relPath}`);
  } else {
    fs.mkdirSync(path.dirname(path.resolve(relPath)), { recursive: true });
    fs.writeFileSync(path.resolve(relPath), text, "utf8");
    console.log(`Updated: ${relPath}`);
  }
}

console.log(`\n${dryRun ? "Dry-run successful!" : "All changes applied successfully!"} (${operations.length} blocks across ${fileMap.size} files)`);
EOF
