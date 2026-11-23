/**
 * scripts/lib/patch_apply.js
 * Atomic in-memory patch applier for diff, subst, and full-file operations.
 * Normalizes line endings to LF and only writes disk changes after all checks pass.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parsePatch } from "./patch_parse.js";

const TEXT_EXT = /\.(js|mjs|cjs|json|md|html|css|txt|yml|yaml)$/i;
const MAX_REPORT_HITS = 40;

function toRel(rootDir, abs) {
  return path.relative(rootDir, abs).replace(/\\/g, "/");
}

function resolveFileInRoot(rootDir, rel) {
  if (!rel || path.isAbsolute(rel)) return null;
  const abs = path.resolve(rootDir, rel);
  const r = path.relative(rootDir, abs);
  if (!r || r.startsWith("..") || path.isAbsolute(r)) return null;
  return abs;
}

function resolveScopeInRoot(rootDir, rel) {
  if (!rel || path.isAbsolute(rel)) return null;
  const abs = path.resolve(rootDir, rel);
  const r = path.relative(rootDir, abs);
  if (r.startsWith("..") || path.isAbsolute(r)) return null;
  return abs;
}

function collectScopeFiles(rootDir, scope) {
  const abs = resolveScopeInRoot(rootDir, scope);
  if (!abs) throw new Error(`Scope escapes repository root: "${scope}"`);
  if (!fs.existsSync(abs)) throw new Error(`Scope not found: "${scope}"`);

  const st = fs.statSync(abs);
  if (st.isFile()) return [toRel(rootDir, abs)];

  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "tmp" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && TEXT_EXT.test(entry.name)) files.push(toRel(rootDir, full));
    }
  })(abs);

  files.sort();
  if (files.length === 0) throw new Error(`No text files found in scope "${scope}"`);
  return files;
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
    if (!isInsideReplace) indices.push(sStart);
    pos += 1;
  }
  return indices;
}

function findNonOverlappingIndices(text, needle) {
  const indices = [];
  let pos = 0;
  while ((pos = text.indexOf(needle, pos)) !== -1) {
    const nextOverlap = text.indexOf(needle, pos + 1);
    if (nextOverlap !== -1 && nextOverlap < pos + needle.length) {
      return { overlapAt: pos, indices };
    }
    indices.push(pos);
    pos += needle.length;
  }
  return { overlapAt: -1, indices };
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

function lineInfoAt(text, idx) {
  const lineStart = idx === 0 ? 0 : text.lastIndexOf("\n", idx - 1) + 1;
  const lineEndRaw = text.indexOf("\n", idx);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  let lineNo = 1;
  for (let i = 0; i < lineStart; i++) {
    if (text.charCodeAt(i) === 10) lineNo++;
  }
  return { lineNo, lineText: text.slice(lineStart, lineEnd).trim().slice(0, 140) };
}

export function applyPatch(raw, { root = process.cwd(), dryRun = true } = {}) {
  const rootDir = path.resolve(root);
  const operations = parsePatch(raw);
  const fileMap = new Map();
  const originalFileMap = new Map();
  const logs = [];
  let appliedCount = 0;
  let skippedCount = 0;

  function getFile(rel) {
    const abs = resolveFileInRoot(rootDir, rel);
    if (!abs) throw new Error(`File path escapes repository root: "${rel}"`);
    const normRel = toRel(rootDir, abs);
    if (!fileMap.has(normRel)) {
      const content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8").replace(/\r\n?/g, "\n") : null;
      fileMap.set(normRel, content);
      originalFileMap.set(normRel, content);
    }
    return { normRel, text: fileMap.get(normRel) };
  }

  for (const op of operations) {
    if (op.type === "diff") {
      let { normRel, text } = getFile(op.file);
      if (text === null) {
        throw new Error(`Cannot patch non-existent file: "${op.file}"`);
      }

      op.hunks.forEach(({ search, replace }, hunkIdx) => {
        const hunkLabel = op.hunks.length > 1 ? `Hunk #${hunkIdx + 1}` : "Diff hunk";
        const replaceRanges = findReplaceRanges(text, replace);
        const outsideSearches = findOutsideSearchIndices(text, search, replaceRanges);

        if (outsideSearches.length === 0) {
          if (replaceRanges.length > 0) {
            logs.push(`[info] ${hunkLabel} in "${normRel}" already applied, skipping.`);
            skippedCount++;
            return;
          }
          throw new Error(`Search block not found in "${normRel}":\n---\n${search.slice(0, 160)}\n---`);
        }

        if (outsideSearches.length > 1) {
          throw new Error(`Search block matched ${outsideSearches.length} times in "${normRel}".`);
        }

        const targetIdx = outsideSearches[0];
        text = text.slice(0, targetIdx) + replace + text.slice(targetIdx + search.length);
        appliedCount++;
      });

      fileMap.set(normRel, text);
    } else if (op.type === "file") {
      const { normRel, text: current } = getFile(op.file);
      const target = op.content.endsWith("\n") ? op.content : op.content + "\n";
      if (current === target) {
        logs.push(`[info] File "${normRel}" already up to date, skipping.`);
        skippedCount++;
      } else {
        fileMap.set(normRel, target);
        appliedCount++;
      }
    } else if (op.type === "subst") {
      const { search, replace } = op.hunk;
      if (search === replace) {
        throw new Error(`subst block at line ${op.line} has identical search and replace text`);
      }

      const scopeFiles = collectScopeFiles(rootDir, op.scope);
      const perFile = [];
      let totalMatches = 0;
      let replaceTotal = 0;

      for (const rel of scopeFiles) {
        const { normRel, text } = getFile(rel);
        if (text === null) continue;

        const { overlapAt, indices } = findNonOverlappingIndices(text, search);
        if (overlapAt !== -1) {
          const info = lineInfoAt(text, overlapAt);
          throw new Error(`Overlapping match for subst in ${normRel}:${info.lineNo}: ${info.lineText}`);
        }

        if (indices.length > 0) {
          perFile.push({ normRel, text, indices });
          totalMatches += indices.length;
        }
        if (replace !== "") {
          replaceTotal += countOccurrences(text, replace);
        }
      }

      if (totalMatches === 0 && replace !== "" && replaceTotal >= op.expect) {
        logs.push(`[info] subst in "${op.scope}" already applied (${replaceTotal} replacement occurrence(s) present), skipping.`);
        skippedCount++;
        continue;
      }

      if (totalMatches !== op.expect) {
        const hits = [];
        for (const { normRel, text, indices } of perFile) {
          for (const idx of indices) {
            if (hits.length >= MAX_REPORT_HITS) break;
            const info = lineInfoAt(text, idx);
            hits.push(`  ${normRel}:${info.lineNo}: ${info.lineText}`);
          }
          if (hits.length >= MAX_REPORT_HITS) break;
        }
        const detail = hits.length > 0 ? `\n${hits.join("\n")}` : "";
        const more = totalMatches > hits.length ? `\n  ... and ${totalMatches - hits.length} more` : "";
        throw new Error(
          `subst in "${op.scope}" (line ${op.line}) expected ${op.expect} match(es), found ${totalMatches}:${detail}${more}`
        );
      }

      for (const { normRel, text, indices } of perFile) {
        let out = "";
        let cursor = 0;
        for (const idx of indices) {
          out += text.slice(cursor, idx) + replace;
          cursor = idx + search.length;
        }
        out += text.slice(cursor);
        fileMap.set(normRel, out);
      }
      logs.push(`[subst] "${op.scope}": replaced ${totalMatches} match(es) across ${perFile.length} file(s).`);
      appliedCount++;
    }
  }

  const modifiedFiles = [];
  for (const [relPath, text] of fileMap.entries()) {
    if (text !== originalFileMap.get(relPath)) {
      modifiedFiles.push(relPath);
    }
  }

  if (!dryRun && modifiedFiles.length > 0) {
    for (const relPath of modifiedFiles) {
      const fullPath = resolveFileInRoot(rootDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, fileMap.get(relPath), "utf8");
    }

    const genRegPath = path.join(rootDir, "scripts", "gen_registry.js");
    if (
      fs.existsSync(genRegPath) &&
      modifiedFiles.some(p => p.startsWith("src/topics/") || p.startsWith("src/mcq/"))
    ) {
      execFileSync(process.execPath, [genRegPath], { cwd: rootDir, stdio: "inherit" });
    }
  }

  return {
    modifiedFiles,
    touchedFiles: Array.from(fileMap.keys()),
    appliedCount,
    skippedCount,
    logs
  };
}
