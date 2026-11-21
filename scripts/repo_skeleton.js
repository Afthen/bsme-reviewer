/**
 * scripts/repo_skeleton.js
 * Zero-dependency Repo Skeleton & Resolved Import Graph Generator.
 * Usage: node scripts/repo_skeleton.js [path-substring-filter]
 */

import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app.js", "src", "scripts", "test"];
const FILTER = process.argv[2] || "";

function collectJsFiles(target, acc = []) {
  const full = path.resolve(target);
  if (!fs.existsSync(full)) return acc;
  const st = fs.statSync(full);
  if (st.isFile() && full.endsWith(".js")) {
    acc.push(full);
  } else if (st.isDirectory()) {
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectJsFiles(path.join(full, entry.name), acc);
    }
  }
  return acc;
}

function toRepoRel(absPath) {
  return path.relative(process.cwd(), absPath).replace(/\\/g, "/");
}

function resolveImportEdge(fromFile, spec) {
  if (!spec.startsWith(".")) return spec;
  return toRepoRel(path.resolve(path.dirname(fromFile), spec));
}

function getLineRange(src, startIdx, endIdx) {
  const startLine = src.slice(0, startIdx + 1).split("\n").length;
  const endLine = src.slice(0, endIdx + 1).split("\n").length;
  return startLine === endLine ? `(${startLine})` : `(${startLine}-${endLine})`;
}

function extractMatchingBlock(src, openIdx, openCh = "{", closeCh = "}") {
  let depth = 0;
  let inStr = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1] || "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i++; }
      continue;
    }
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }

    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return src.slice(openIdx, i + 1);
    }
  }
  return "";
}

function inferReturnHint(fnBody, isAsync, jsdoc) {
  const retTag = jsdoc.match(/@returns?\s+\{([^}]+)\}/);
  if (retTag) return retTag[1].trim();

  const returns = [];
  const retRe = /\breturn\s+([^;\n]+)/g;
  for (const m of fnBody.matchAll(retRe)) {
    const expr = m[1].trim();
    if (expr.startsWith("{")) {
      const keys = Array.from(expr.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*(?::|,|\})/g))
        .map(k => k[1])
        .slice(0, 6);
      returns.push(keys.length ? `{ ${keys.join(", ")} }` : "object");
    } else if (expr.startsWith("[")) {
      returns.push("array");
    } else if (expr === "true" || expr === "false") {
      returns.push("boolean");
    } else if (expr === "null") {
      returns.push("null");
    } else if (/^["'`]/.test(expr)) {
      returns.push("string");
    } else if (/^-?\d/.test(expr) || expr === "NaN") {
      returns.push("number");
    }
  }

  const unique = Array.from(new Set(returns));
  if (unique.length === 0) return isAsync ? "Promise<void>" : "void";
  const hint = unique.slice(0, 3).join(" | ");
  return isAsync ? `Promise<${hint}>` : hint;
}

function extractTopLevelKeys(objBlock) {
  const keys = [];
  let depth = 0;
  let inStr = null;
  let buf = "";

  for (let i = 0; i < objBlock.length; i++) {
    const ch = objBlock[i];
    if (inStr) {
      if (ch === "\\") { buf += ch + (objBlock[i + 1] || ""); i++; continue; }
      if (ch === inStr) inStr = null;
      buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; buf += ch; continue; }
    if (ch === "{" || ch === "[" || ch === "(") {
      if (depth === 1) buf = "";
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]" || ch === ")") {
      depth--;
      if (depth === 1) buf = "";
      continue;
    }
    if (depth === 1) {
      buf += ch;
      if (ch === ":" || ch === "\n" || ch === ",") {
        const km = buf.match(/^\s*["']?([A-Za-z0-9_]+)["']?\s*:/);
        if (km) keys.push(km[1]);
        buf = "";
      }
    }
  }
  return keys;
}

function analyzeFile(absPath) {
  const raw = fs.readFileSync(absPath, "utf8").replace(/\r\n/g, "\n");
  const rel = toRepoRel(absPath);

  const imports = [];
  for (const m of raw.matchAll(/import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)) {
    imports.push(resolveImportEdge(absPath, m[1]));
  }
  for (const m of raw.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    imports.push(resolveImportEdge(absPath, m[1]));
  }

  const symbols = [];

  // Functions (exported and top-level local)
  const fnRe = /(?:\/\*\*([\s\S]*?)\*\/\s*)?^(export\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/gm;
  for (const m of raw.matchAll(fnRe)) {
    const jsdoc = m[1] || "";
    const scope = m[2] ? "export fn" : "local fn";
    const isAsync = Boolean(m[3]);
    const name = m[4];
    const params = m[5].replace(/\s+/g, " ").trim();
    const braceIdx = m.index + m[0].length - 1;
    const body = extractMatchingBlock(raw, braceIdx);
    const endIdx = braceIdx + body.length - 1;
    const ret = inferReturnHint(body, isAsync, jsdoc);
    const range = getLineRange(raw, m.index, endIdx);
    symbols.push(`${scope} ${name}(${params}) -> ${ret} ${range}`);
  }

  // Exported constants & frozen structures
  const constRe = /^export\s+const\s+([A-Za-z0-9_]+)\s*=\s*/gm;
  for (const m of raw.matchAll(constRe)) {
    const name = m[1];
    const startIdx = m.index;
    let rest = raw.slice(m.index + m[0].length).trimStart();
    if (rest.startsWith("Object.freeze(")) rest = rest.slice("Object.freeze(".length).trimStart();

    if (rest.startsWith("{")) {
      const blockStart = raw.indexOf("{", m.index + m[0].length);
      const block = extractMatchingBlock(raw, blockStart, "{", "}");
      const endIdx = blockStart + block.length - 1;
      const keys = extractTopLevelKeys(block);
      const preview = keys.length > 8
        ? `${keys.slice(0, 8).join(", ")}, +${keys.length - 8}`
        : keys.join(", ");
      symbols.push(`export const ${name}: { ${preview} } ${getLineRange(raw, startIdx, endIdx)}`);
    } else if (rest.startsWith("[")) {
      const endOfLine = raw.indexOf("\n", startIdx);
      const endIdx = endOfLine === -1 ? raw.length - 1 : endOfLine - 1;
      symbols.push(`export const ${name}: Array ${getLineRange(raw, startIdx, endIdx)}`);
    } else if (rest.startsWith("(") || /^[A-Za-z0-9_]+\s*=>/.test(rest)) {
      const endOfLine = raw.indexOf("\n", startIdx);
      const endIdx = endOfLine === -1 ? raw.length - 1 : endOfLine - 1;
      symbols.push(`export const ${name}: Function ${getLineRange(raw, startIdx, endIdx)}`);
    } else {
      const valLine = rest.split("\n")[0].replace(/;$/, "").slice(0, 48);
      const endOfLine = raw.indexOf("\n", startIdx);
      const endIdx = endOfLine === -1 ? raw.length - 1 : endOfLine - 1;
      symbols.push(`export const ${name} = ${valLine} ${getLineRange(raw, startIdx, endIdx)}`);
    }
  }

  for (const m of raw.matchAll(/^export\s+\*\s+from\s+["']([^"']+)["']/gm)) {
    const range = getLineRange(raw, m.index, m.index + m[0].length - 1);
    symbols.push(`reexport * -> ${resolveImportEdge(absPath, m[1])} ${range}`);
  }

  return { rel, imports: Array.from(new Set(imports)), symbols };
}

const files = ROOTS.flatMap(r => collectJsFiles(r))
  .map(analyzeFile)
  .filter(f => !FILTER || f.rel.includes(FILTER));

const skelLines = [];
for (const f of files) {
  skelLines.push(`FILE: ${f.rel}`);
  if (f.imports.length) skelLines.push(`  imports: ${f.imports.join(", ")}`);
  for (const s of f.symbols) skelLines.push(`  ${s}`);
}

const outBlocks = [
  "```repo-skeleton\n" + skelLines.join("\n") + "\n```"
];

const readmePath = path.resolve("README.md");
if (fs.existsSync(readmePath)) {
  const readmeBody = fs.readFileSync(readmePath, "utf8").replace(/\r\n/g, "\n").trimEnd();
  outBlocks.push("`````README.md\n" + readmeBody + "\n`````");
}

const outPath = path.resolve("tmp/skeleton.txt");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, outBlocks.join("\n\n") + "\n", "utf8");
console.log(`Wrote tmp/skeleton.txt (${files.length} files, ${skelLines.length} skeleton lines).`);
