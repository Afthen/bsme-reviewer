cat << 'EOF' > /tmp/apply_patch.mjs
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find(a => !a.startsWith("-"));
const raw = fs.readFileSync(fileArg || 0, "utf8").replace(/\r\n/g, "\n");

const FILE_PATH_RE = /^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:js|mjs|cjs|ts|md|html|css|json|txt)$/;

function extractFileTarget(line) {
  const trimmed = line.trim();
  const explicit = trimmed.match(/^FILE:\s*(\S+)$/);
  if (explicit && FILE_PATH_RE.test(explicit[1])) return explicit[1];

  const isHeading = /^#{1,6}\s+/.test(trimmed);
  const isBoldLabel = /^\*\*`[^`]+`[:*]*\*\*[:\s]*$/.test(trimmed);
  if (!isHeading && !isBoldLabel) return null;

  for (const m of trimmed.matchAll(/`([^`]+)`/g)) {
    if (FILE_PATH_RE.test(m[1])) return m[1];
  }
  return null;
}

function parseHunks(block) {
  const lines = block.split("\n");
  const hunks = [];
  let state = "idle";
  let search = [];
  let replace = [];

  for (const line of lines) {
    if (state === "idle" && line === "<<<<") {
      state = "search";
      search = [];
      replace = [];
    } else if (state === "search" && line === "====") {
      state = "replace";
    } else if (state === "replace" && line === ">>>>") {
      hunks.push({ search: search.join("\n"), replace: replace.join("\n") });
      state = "idle";
    } else if (state === "search") {
      search.push(line);
    } else if (state === "replace") {
      replace.push(line);
    }
  }
  if (state !== "idle") throw new Error("Unclosed <<<< ==== >>>> diff hunk.");
  return hunks;
}

const lines = raw.split("\n");
const operations = [];
let currentFile = null;
let inFence = false;
let fenceLen = 0;
let fenceLang = "";
let fenceBuf = [];

for (const line of lines) {
  if (!inFence) {
    const target = extractFileTarget(line);
    if (target) {
      currentFile = target;
      continue;
    }
    const open = line.match(/^(`{3,})([A-Za-z0-9_-]*)\s*$/);
    if (open) {
      inFence = true;
      fenceLen = open[1].length;
      fenceLang = open[2].toLowerCase();
      fenceBuf = [];
    }
  } else {
    const closeRe = new RegExp(`^\`{${fenceLen},}\\s*$`);
    if (closeRe.test(line)) {
      const content = fenceBuf.join("\n");
      const hasHunkMarkers = /^<<<<\n[\s\S]*?\n====\n[\s\S]*?\n>>>>$/m.test(content);
      const isDiff = fenceLang === "diff" || (fenceLang === "" && hasHunkMarkers);

      if (currentFile) {
        operations.push({ file: currentFile, isDiff, content });
      }
      inFence = false;
      fenceLen = 0;
      fenceLang = "";
      fenceBuf = [];
    } else {
      fenceBuf.push(line);
    }
  }
}

if (operations.length === 0) {
  throw new Error("No file operations parsed. Ensure FILE: <path> or heading/bold labels precede code blocks.");
}

// Transactional in-memory pass (all hunks must match uniquely before touching disk)
const fileBuffers = new Map();
const getBuffer = (relPath) => {
  if (!fileBuffers.has(relPath)) {
    fileBuffers.set(relPath, fs.existsSync(relPath) ? fs.readFileSync(relPath, "utf8").replace(/\r\n/g, "\n") : null);
  }
  return fileBuffers.get(relPath);
};

for (const op of operations) {
  if (op.isDiff) {
    let text = getBuffer(op.file);
    if (text === null) throw new Error(`Cannot apply diff: "${op.file}" does not exist.`);
    const hunks = parseHunks(op.content);
    if (hunks.length === 0) throw new Error(`Diff block for "${op.file}" contained no <<<< ==== >>>> hunks.`);

    for (const { search, replace } of hunks) {
      let count = 0;
      let pos = 0;
      while ((pos = text.indexOf(search, pos)) !== -1) {
        count++;
        pos += search.length;
      }
      if (count === 0) {
        throw new Error(`Search block not found in "${op.file}":\n---\n${search}\n---`);
      }
      if (count > 1) {
        throw new Error(`Search block matched ${count} times (ambiguous) in "${op.file}":\n---\n${search}\n---`);
      }
      const idx = text.indexOf(search);
      text = text.slice(0, idx) + replace + text.slice(idx + search.length);
    }
    fileBuffers.set(op.file, text);
  } else {
    fileBuffers.set(op.file, op.content.endsWith("\n") ? op.content : `${op.content}\n`);
  }
}

for (const [relPath, text] of fileBuffers.entries()) {
  if (dryRun) {
    console.log(`[dry-run] Would write: ${relPath}`);
  } else {
    fs.mkdirSync(path.dirname(relPath), { recursive: true });
    fs.writeFileSync(relPath, text, "utf8");
    console.log(`Updated: ${relPath}`);
  }
}
console.log(`${dryRun ? "Dry-run passed" : "Applied"} (${operations.length} block(s) across ${fileBuffers.size} file(s)).`);
EOF
