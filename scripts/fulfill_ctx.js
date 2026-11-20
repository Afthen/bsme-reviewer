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
  if (line.startsWith("READ ")) {
    const spec = line.slice(5).trim();
    const rangeMatch = spec.match(/^(.+?):(\d+)-(\d+)$/);
    const relPath = rangeMatch ? rangeMatch[1].trim() : spec;
    const fullPath = path.resolve(relPath);

    if (!fs.existsSync(fullPath)) {
      out.push(`FILE: ${relPath}\n[ERROR: File not found]\n`);
      continue;
    }

    const fileLines = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n").split("\n");
    const start = rangeMatch ? Math.max(1, parseInt(rangeMatch[2], 10)) : 1;
    const end = rangeMatch ? Math.min(fileLines.length, parseInt(rangeMatch[3], 10)) : fileLines.length;

    const numbered = fileLines
      .slice(start - 1, end)
      .map((l, idx) => `${start + idx}: ${l}`)
      .join("\n");

    const header = rangeMatch ? `FILE: ${relPath} (lines ${start}-${end})` : `FILE: ${relPath}`;
    out.push(`${header}\n\`\`\`\n${numbered}\n\`\`\`\n`);
  } else if (line.startsWith("GREP ")) {
    const term = line.slice(5).trim().replace(/^["']|["']$/g, "");
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
}

fs.mkdirSync(path.dirname(RES_FILE), { recursive: true });
fs.writeFileSync(RES_FILE, out.join("\n"), "utf8");
console.log(`Wrote tmp/ctx_res.txt (${lines.length} directive(s)).`);
