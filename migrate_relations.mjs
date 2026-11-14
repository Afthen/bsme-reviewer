/**
 * migrate_relations.mjs
 * Temporary deterministic codemod: converts all existing relations.js files under
 * src/topics/ to use defineRelation + compileRelations (drops manual nodes arrays,
 * renames baseFormula -> formula). Delete this file after running!
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const TOPICS_DIR = path.resolve("src/topics");
const BUILDER_PATH = path.resolve("src/core/relation_builder.js");

function findRelationFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "springs") continue;
      results.push(...findRelationFiles(full));
    } else if (entry.name.endsWith("relations.js")) {
      results.push(full);
    }
  }
  return results;
}

function splitTopLevelArrayItems(arrBody) {
  const items = [];
  let depth = 0;
  let inStr = null;
  let inLineComment = false;
  let inBlockComment = false;
  let start = 0;

  for (let i = 0; i < arrBody.length; i++) {
    const ch = arrBody[i];
    const next = arrBody[i + 1];

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
    if (ch === `"` || ch === `'` || ch === "`") { inStr = ch; continue; }

    if (ch === "{" || ch === "[" || ch === "(") depth++;
    else if (ch === "}" || ch === "]" || ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      const slice = arrBody.slice(start, i).trim();
      if (slice) items.push(slice);
      start = i + 1;
    }
  }
  const tail = arrBody.slice(start).trim();
  if (tail) items.push(tail);
  return items;
}

function formatSpecObj(obj) {
  const out = {
    id: obj.id,
    name: obj.name,
    formula: obj.baseFormula || obj.formula
  };
  if (obj.canonicalTex) out.canonicalTex = obj.canonicalTex;
  if (obj.requiredUnits) out.requiredUnits = obj.requiredUnits;
  if (obj.variants) {
    out.variants = {};
    for (const [k, v] of Object.entries(obj.variants)) {
      const vOut = { formula: v.baseFormula || v.formula };
      if (v.canonicalTex) vOut.canonicalTex = v.canonicalTex;
      if (v.requiredUnits) vOut.requiredUnits = v.requiredUnits;
      out.variants[k] = vOut;
    }
  }
  return `defineRelation(${JSON.stringify(out, null, 2).replace(/\n/g, "\n  ")})`;
}

let migrated = 0;
for (const file of findRelationFiles(TOPICS_DIR)) {
  const raw = fs.readFileSync(file, "utf8");
  if (raw.includes("compileRelations(")) continue;

  const exportMatch = raw.match(/export const ([A-Za-z0-9_]+)\s*=\s*(?:Object\.freeze\(\s*)?\[/);
  if (!exportMatch) {
    console.warn(`Skipped (unrecognized export): ${file}`);
    continue;
  }

  const openBracketIdx = raw.indexOf("[", exportMatch.index);
  let depth = 0, closeBracketIdx = -1, inStr = null;
  for (let i = openBracketIdx; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === `"` || ch === `'` || ch === "`") { inStr = ch; continue; }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) { closeBracketIdx = i; break; }
    }
  }

  const arrBody = raw.slice(openBracketIdx + 1, closeBracketIdx);
  const items = splitTopLevelArrayItems(arrBody);
  const transformedItems = items.map(chunk => {
    const cleaned = chunk.replace(/^\s*\/\/.*$/gm, "").trim();
    if (cleaned.startsWith("...")) return `  ${cleaned}`;
    const obj = vm.runInNewContext(`(${cleaned})`, {});
    return `  ${formatSpecObj(obj)}`;
  });

  let relImport = path.relative(path.dirname(file), BUILDER_PATH).replace(/\\/g, "/");
  if (!relImport.startsWith(".")) relImport = `./${relImport}`;

  const headerEnd = raw.slice(0, exportMatch.index);
  const importLine = `import { defineRelation, compileRelations } from "${relImport}";\n`;
  const hasImports = /^import\s/m.test(headerEnd);
  const newPrefix = hasImports
    ? headerEnd.replace(/(import[^\n]+\n)(?![\s\S]*import\s)/, `$1${importLine}`)
    : `${headerEnd}${importLine}\n`;

  const output = `${newPrefix}export const ${exportMatch[1]} = compileRelations([\n${transformedItems.join(",\n")}\n]);\n`;
  fs.writeFileSync(file, output.replace(/\r\n/g, "\n"), "utf8");
  migrated++;
  console.log(`Migrated: ${path.relative(process.cwd(), file)}`);
}

console.log(`Done. Migrated ${migrated} file(s). Delete migrate_relations.mjs and run: npm test && npm run audit`);
