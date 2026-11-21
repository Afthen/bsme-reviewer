/**
 * scripts/fulfill_ctx.js
 * Reads <ctx_req>...</ctx_req> from tmp/ctx_req.txt and writes
 * the requested files/ranges/grep results to tmp/ctx_res.txt.
 */

import fs from "node:fs";
import path from "node:path";

const REQ_FILE = path.resolve("tmp/ctx_req.txt");
const RES_FILE = path.resolve("tmp/ctx_res.txt");
const SEARCH_ROOTS = ["app.js", "index.html", "package.json", "src", "styles", "test", "scripts"];

if (!fs.existsSync(REQ_FILE)) {
  console.error("Missing tmp/ctx_req.txt — paste the model's <ctx_req> block there first.");
  process.exit(1);
}

const raw = fs.readFileSync(REQ_FILE, "utf8");
const match = raw.match(/<ctx_req>([\s\S]*?)<\/ctx_req>/i);
const body = (match ? match[1] : raw).trim();

const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
if (lines.length === 0) {
  console.error("No READ or GREP directives found in tmp/ctx_req.txt.");
  process.exit(1);
}

function collectFiles(target, acc = []) {
  const full = path.resolve(target);
  if (!fs.existsSync(full)) return acc;
  const st = fs.statSync(full);
  if (st.isFile()) acc.push(full);
  else if (st.isDirectory()) {
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectFiles(path.join(full, entry.name), acc);
    }
  }
  return acc;
}

const out = [];

for (const line of lines) {
  // 1. SCOPED GREP: GREP path:start-end term
  const scopedGrepMatch = line.match(/^GREP (.+?):(-?\d+)-?(\d*)?\s+(.+)$/);

  // 2. GLOBAL GREP: GREP term
  const globalGrepMatch = line.match(/^GREP (.+)$/);

  // 3. READ: READ path[:range]
  const readMatch = line.match(/^READ (.+?)(?::(-?\d+)-?(\d*))?$/);

  if (scopedGrepMatch) {
    const [_, relPath, startStr, endStr, term] = scopedGrepMatch;
    const fullPath = path.resolve(relPath);
    const termClean = term.replace(/^["']|["']$/g, "");
    const hits = [];

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const fileLines = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n").split("\n");
      
      // Calculate slice indices
      let sIdx = parseInt(startStr, 10);
      let eIdx = endStr ? parseInt(endStr, 10) : fileLines.length;
      
      // Normalize (handle -N and N-)
      if (sIdx < 0) sIdx = fileLines.length + sIdx; else sIdx = sIdx - 1;
      if (eIdx === fileLines.length && endStr === "") { /* end is len */ } 
      else if (eIdx !== fileLines.length) { eIdx = eIdx; } // wait, if endStr is present, use it

      // Correcting the slice logic for the specific parsed parts:
      // Case -20: startIdx = len - 20, endIdx = len
      // Case 10-: startIdx = 9, endIdx = len
      // Case 10-50: startIdx = 9, endIdx = 50
      
      const actualStart = sIdx < 0 ? 0 : sIdx;
      const actualEnd = eIdx < 0 ? 0 : eIdx;
      const clampedStart = Math.max(0, Math.min(actualStart, fileLines.length));
      const clampedEnd = Math.max(0, Math.min(actualEnd, fileLines.length));

      for (let i = clampedStart; i < clampedEnd; i++) {
        if (fileLines[i].includes(termClean)) {
          hits.push(`${relPath}:${i + 1}: ${fileLines[i].trim()}`);
        }
      }
    }
    out.push(`GREP: "${termClean}" (scoped in ${relPath}, ${hits.length} matches)\n\`\`\`\n${hits.join("\n") || "(no matches)"}\n\`\`\`\n`);
  } 
  else if (globalGrepMatch) {
    const term = globalGrepMatch[1].trim().replace(/^["']|["']$/g, "");
    const hits = [];
    const files = SEARCH_ROOTS.flatMap(r => collectFiles(r));

    for (const f of files) {
      if (hits.length >= 30) break;
      const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
      const content = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n").split("\n");
      content.forEach((l, idx) => {
        if (hits.length < 30 && l.includes(term)) {
          hits.push(`${rel}:${idx + 1}: ${l.trim()}`);
        }
      });
    }
    out.push(`GREP: "${term}" (${hits.length} matches)\n\`\`\`\n${hits.join("\n") || "(no matches)"}\n\`\`\`\n`);
  } 
  else if (readMatch) {
    const [_, relPath, startStr, endStr] = readMatch;
    const fullPath = path.resolve(relPath);

    if (!fs.existsSync(fullPath)) {
      out.push(`FILE: ${relPath}\n[ERROR: File not found]\n`);
      continue;
    }

    const fileLines = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n").split("\n");
    let start = 1;
    let end = fileLines.length;

    if (startStr) {
      let s = parseInt(startStr, 10);
      if (s < 0) {
        start = fileLines.length + s + 1;
      } else {
        start = s;
      }

      if (endStr) {
        end = parseInt(endStr, 10);
      }
    }

    // Clamp
    start = Math.max(1, Math.min(start, fileLines.length));
    end = Math.max(1, Math.min(end, fileLines.length));
    if (start > end) [start, end] = [end, start];

    const numbered = fileLines
      .slice(start - 1, end)
      .map((l, idx) => `${start + idx}: ${l}`)
      .join("\n");

    const header = (startStr || endStr) ? `FILE: ${relPath} (lines ${start}-${end})` : `FILE: ${relPath}`;
    out.push(`${header}\n\`\`\`\n${numbered}\n\`\`\`\n`);
  }
}

fs.mkdirSync(path.dirname(RES_FILE), { recursive: true });
fs.writeFileSync(RES_FILE, out.join("\n"), "utf8");
console.log(`Wrote tmp/ctx_res.txt (${lines.length} directive(s)).`);
