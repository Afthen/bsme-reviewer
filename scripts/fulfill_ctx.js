/**
 * scripts/fulfill_ctx.js
 * Reads READ / OUTLINE / GREP directives from tmp/ctx_req.txt and writes the
 * results to tmp/ctx_res.txt. Each request has a planning budget (directive
 * count + output lines) so models plan their context needs up front.
 *
 *   READ path               full file (<= FULL_READ_MAX lines, else outline)
 *   READ path:a-b           line range (snaps to enclosing small symbols)
 *   READ path:-N            last N lines
 *   READ path#sym[,sym2]    exact symbol bodies, no line numbers needed
 *   OUTLINE path            exact symbol ranges for one file
 *   GREP [-C n] [-i] term [@ path[:a-b]]   literal search, optional context/scope
 *   TRACE topic[SI|US] relation -> target {tok:unit, ...} [seed=N]
 *                           re-run one matrix case; report where non-canonical scalars are born */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractSymbols, findEnclosing } from "./lib/symbols.js";
import { parseCase } from "./lib/trace_parse.js";

export const LIMITS = Object.freeze({
  MAX_DIRECTIVES: 8,
  MAX_OUTPUT_LINES: 700,
  FULL_READ_MAX: 400,
  SNAP_MAX: 200,
  MAX_GREP_HITS: 40,
  MAX_GREP_CONTEXT: 10,
  MAX_OUTLINE_ENTRIES: 150,
  MAX_LINE_CHARS: 200,
  MAX_TRACE_LINES: 80,
  TRACE_TIMEOUT_MS: 120000
});

const SEARCH_ROOTS = ["app.js", "index.html", "package.json", "src", "styles", "test", "scripts"];
const TEXT_EXT = /\.(?:js|json|html|css|md|txt)$/;
const FENCE = "`".repeat(3);

const fenced = (header, body) => `${header}\n${FENCE}\n${body}\n${FENCE}\n`;
const clip = (s) => (s.length > LIMITS.MAX_LINE_CHARS ? `${s.slice(0, LIMITS.MAX_LINE_CHARS)}…` : s);
const numbered = (lines, a, b) => lines.slice(a - 1, b).map((l, i) => `${a + i}: ${l}`).join("\n");

function resolveInRoot(root, rel) {
  const abs = path.resolve(root, rel);
  const r = path.relative(root, abs);
  return r.startsWith("..") || path.isAbsolute(r) ? null : abs;
}

function loadFile(root, rel) {
  const abs = resolveInRoot(root, rel);
  if (!abs) return { error: "path escapes repository root" };
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return { error: "file not found" };
  const text = fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return { abs, text, lines };
}

function collectFiles(target, acc = []) {
  if (!fs.existsSync(target)) return acc;
  const st = fs.statSync(target);
  if (st.isFile()) {
    if (TEXT_EXT.test(target)) acc.push(target);
  } else if (st.isDirectory()) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectFiles(path.join(target, entry.name), acc);
    }
  }
  return acc;
}

const symbolsOf = (rel, text) => (rel.endsWith(".js") ? extractSymbols(text) : []);

function outlineRows(syms) {
  const shown = syms.slice(0, LIMITS.MAX_OUTLINE_ENTRIES);
  const rows = shown.map((s) => `${s.start}-${s.end}  ${s.exported ? "export" : "local"} ${s.kind} ${s.name}`);
  if (syms.length > shown.length) rows.push(`(+${syms.length - shown.length} more symbols; use GREP to locate them)`);
  return rows.length ? rows.join("\n") : "(no top-level symbols; use a line range)";
}

const errorBlock = (rel, msg) => ({ text: `FILE: ${rel}\n[ERROR: ${msg}]\n`, lines: 1 });

function handleOutline(arg, { root }) {
  const f = loadFile(root, arg);
  if (f.error) return errorBlock(arg, f.error);
  const body = outlineRows(symbolsOf(arg, f.text));
  return { text: fenced(`OUTLINE: ${arg} (${f.lines.length} lines)`, body), lines: body.split("\n").length };
}

function refuse(rel, f, needed, remaining) {
  const body = outlineRows(symbolsOf(rel, f.text));
  return {
    text:
      `FILE: ${rel}\n[SKIPPED: would return ${needed} lines but only ${remaining} remain in this request's budget. ` +
      `Use READ ${rel}#symbol or a narrower range from the outline below.]\n` +
      fenced(`OUTLINE: ${rel} (${f.lines.length} lines)`, body),
    lines: body.split("\n").length
  };
}

function readSymbols(rel, f, names, remaining) {
  const syms = symbolsOf(rel, f.text);
  const blocks = [];
  const picked = [];
  for (const name of names) {
    const hits = syms.filter((s) => s.name === name);
    if (hits.length === 0) {
      const near = syms.filter((s) => s.name.toLowerCase().includes(name.toLowerCase())).map((s) => s.name);
      const pool = near.length ? near : syms.slice(0, 30).map((s) => s.name);
      blocks.push(`FILE: ${rel}#${name}\n[ERROR: symbol not found. ${near.length ? "Similar" : "Available"}: ${pool.join(", ") || "(none)"}]\n`);
    } else picked.push(...hits);
  }
  const needed = picked.reduce((n, s) => n + (s.end - s.start + 1), 0);
  if (needed > remaining) return refuse(rel, f, needed, remaining);
  for (const s of picked) {
    blocks.push(fenced(`FILE: ${rel}#${s.name} (lines ${s.start}-${s.end} of ${f.lines.length})`, numbered(f.lines, s.start, s.end)));
  }
  return { text: blocks.join("\n"), lines: needed + (blocks.length - picked.length) };
}

function snapRange(syms, a0, b0) {
  let a = a0;
  let b = b0;
  const notes = [];
  for (const s of syms) {
    const size = s.end - s.start + 1;
    const cutsStart = a > s.start && a <= s.end;
    const cutsEnd = b >= s.start && b < s.end;
    if (!cutsStart && !cutsEnd) continue;
    if (size > LIMITS.SNAP_MAX) {
      notes.push(`range cuts through ${s.name} (${s.start}-${s.end}, ${size} lines; too large to snap, use READ #${s.name} for all of it)`);
      continue;
    }
    if (cutsStart) a = s.start;
    if (cutsEnd) b = s.end;
    notes.push(`snapped to ${s.name} (${s.start}-${s.end})`);
  }
  return { a, b, notes };
}

function handleRead(arg, { root, remaining }) {
  const m = arg.match(/^(.+?)(?:#([\w$]+(?:,[\w$]+)*)|:(-)?(\d+)(?:(-)(\d*))?)?$/);
  const rel = m[1].trim();
  const f = loadFile(root, rel);
  if (f.error) return errorBlock(rel, f.error);
  const N = f.lines.length;

  if (m[2]) return readSymbols(rel, f, m[2].split(","), remaining);

  if (!m[4]) {
    if (N > LIMITS.FULL_READ_MAX) {
      const body = outlineRows(symbolsOf(rel, f.text));
      return {
        text:
          `FILE: ${rel}\n[Bare READ skipped: file has ${N} lines, which exceeds ${LIMITS.FULL_READ_MAX}. ` +
          `Request READ ${rel}#symbol or READ ${rel}:a-b using the outline below.]\n` +
          fenced(`OUTLINE: ${rel} (${N} lines)`, body),
        lines: body.split("\n").length
      };
    }
    if (N > remaining) return refuse(rel, f, N, remaining);
    return { text: fenced(`FILE: ${rel} (${N} lines)`, numbered(f.lines, 1, N)), lines: N };
  }

  const notes = [];
  let a;
  let b;
  if (m[3]) {
    a = Math.max(1, N - Number(m[4]) + 1);
    b = N;
  } else {
    a = Math.max(1, Number(m[4]));
    b = m[5] ? (m[6] ? Number(m[6]) : N) : N;
  }
  if (a > N) return errorBlock(rel, `file has ${N} lines; requested start ${a}`);
  if (a > b) return errorBlock(rel, `invalid range ${a}-${b}`);
  if (b > N) { notes.push(`requested end ${b}, file has ${N} lines`); b = N; }

  const snapped = snapRange(symbolsOf(rel, f.text), a, b);
  if (snapped.a !== a || snapped.b !== b) notes.unshift(`requested ${a}-${b}`);
  notes.push(...snapped.notes);
  a = snapped.a;
  b = snapped.b;

  const needed = b - a + 1;
  if (needed > remaining) return refuse(rel, f, needed, remaining);
  const noteText = notes.length ? `\n[${notes.join("; ")}]` : "";
  return { text: fenced(`FILE: ${rel} (lines ${a}-${b} of ${N})${noteText}`, numbered(f.lines, a, b)), lines: needed };
}

function parseGrepArgs(arg) {
  let rest = arg;
  let ctx = 0;
  let ci = false;
  for (;;) {
    let m = rest.match(/^-C\s*(\d+)\s+(.*)$/);
    if (m) { ctx = Math.min(Number(m[1]), LIMITS.MAX_GREP_CONTEXT); rest = m[2]; continue; }
    m = rest.match(/^-i\s+(.*)$/);
    if (m) { ci = true; rest = m[1]; continue; }
    break;
  }
  let scope = null;
  const at = rest.lastIndexOf(" @ ");
  if (at >= 0) { scope = rest.slice(at + 3).trim(); rest = rest.slice(0, at); }
  return { ctx, ci, scope, term: rest.trim().replace(/^["']|["']$/g, "") };
}

function mergeWindows(indices, ctx, total) {
  const windows = [];
  for (const i of indices) {
    const lo = Math.max(0, i - ctx);
    const hi = Math.min(total - 1, i + ctx);
    const last = windows[windows.length - 1];
    if (last && lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
    else windows.push([lo, hi]);
  }
  return windows;
}

function handleGrep(arg, { root, remaining }) {
  const { ctx, ci, scope, term } = parseGrepArgs(arg);
  if (!term) return { text: "[ERROR: GREP needs a search term]\n", lines: 1 };

  let range = null;
  let files;
  if (scope) {
    const sm = scope.match(/^(.+?)(?::(\d+)-(\d+))?$/);
    if (sm[2]) range = [Number(sm[2]), Number(sm[3])];
    const abs = resolveInRoot(root, sm[1]);
    if (!abs) return { text: `[ERROR: scope ${sm[1]} escapes repository root]\n`, lines: 1 };
    files = collectFiles(abs);
  } else {
    files = SEARCH_ROOTS.flatMap((r) => collectFiles(path.resolve(root, r)));
  }
  files.sort();

  const needle = ci ? term.toLowerCase() : term;
  const byFile = new Map();
  let total = 0;
  let shown = 0;
  for (const abs of files) {
    const rel = path.relative(root, abs).replace(/\\/g, "/");
    const lines = fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n").split("\n");
    const lo = range ? Math.max(0, range[0] - 1) : 0;
    const hi = range ? Math.min(lines.length, range[1]) : lines.length;
    for (let i = lo; i < hi; i++) {
      if (!(ci ? lines[i].toLowerCase() : lines[i]).includes(needle)) continue;
      total++;
      if (shown >= LIMITS.MAX_GREP_HITS) continue;
      shown++;
      if (!byFile.has(rel)) byFile.set(rel, { lines, hits: [] });
      byFile.get(rel).hits.push(i);
    }
  }

  const out = [];
  let truncated = false;
  for (const [rel, { lines, hits }] of byFile) {
    const syms = rel.endsWith(".js") ? extractSymbols(lines.join("\n")) : [];
    const hitSet = new Set(hits);
    const windows = mergeWindows(hits, ctx, lines.length);
    for (let w = 0; w < windows.length && !truncated; w++) {
      if (ctx > 0 && out.length) out.push("--");
      for (let k = windows[w][0]; k <= windows[w][1]; k++) {
        if (out.length >= remaining) { truncated = true; break; }
        if (hitSet.has(k)) {
          const sym = findEnclosing(syms, k + 1);
          out.push(`${rel}:${k + 1}${sym ? ` [${sym.name}]` : ""}: ${clip(lines[k].trim())}`);
        } else out.push(`${rel}-${k + 1}- ${clip(lines[k].trim())}`);
      }
    }
    if (truncated) break;
  }

  const where = scope ? `, scope ${scope}` : "";
  const cap = total > shown ? `, showing first ${shown}` : "";
  const trunc = truncated ? "\n[output truncated by line budget; narrow with @ path]" : "";
  return {
    text: fenced(`GREP: "${term}" (${total} matches${cap}${where})`, (out.join("\n") || "(no matches)") + trunc),
    lines: Math.max(1, out.length)
  };
}

const TRACE_SCRIPT = fileURLToPath(new URL("./trace_case.js", import.meta.url));

function handleTrace(arg, { remaining }) {
  if (!parseCase(arg)) {
    return { text: "[ERROR: TRACE needs a matrix case: topic[SI|US] relation -> target {tok:unit, ...} [seed=N]]\n", lines: 1 };
  }
  const r = spawnSync(process.execPath, [TRACE_SCRIPT, arg], {
    encoding: "utf8", timeout: LIMITS.TRACE_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024
  });
  const raw = `${r.stdout || ""}${r.stderr ? `\n[stderr]\n${r.stderr}` : ""}`.trim();
  const all = [...(r.error ? [`[TRACE failed: ${r.error.message}]`] : []), ...raw.split("\n").map(clip)];
  const cap = Math.min(remaining, LIMITS.MAX_TRACE_LINES);
  const shown = all.length > cap ? [...all.slice(0, Math.max(0, cap - 1)), `[output truncated at ${cap} lines]`] : all;
  return { text: fenced(`TRACE: ${arg}`, shown.join("\n")), lines: shown.length };
}

const HANDLERS = { READ: handleRead, OUTLINE: handleOutline, GREP: handleGrep, TRACE: handleTrace };
const USAGE = "Valid: READ path[#symbol|:a-b|:-N], OUTLINE path, GREP [-C n] [-i] term [@ path[:a-b]], TRACE topic[SI|US] relation -> target {tok:unit, ...} [seed=N]";

export function parseDirectives(raw) {
  return raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith(FENCE));
}

/** Fulfills a raw request; returns the response text ("" when no directives). */
export function fulfill(raw, { root = process.cwd() } = {}) {
  const directives = parseDirectives(raw);
  if (directives.length === 0) return "";

  const run = directives.slice(0, LIMITS.MAX_DIRECTIVES);
  const dropped = directives.slice(LIMITS.MAX_DIRECTIVES);
  const parts = [];
  let used = 0;

  for (const line of run) {
    const remaining = Math.max(0, LIMITS.MAX_OUTPUT_LINES - used);
    const m = line.match(/^(READ|OUTLINE|GREP|TRACE)\s+(.+)$/);
    const r = m ? HANDLERS[m[1]](m[2].trim(), { root, remaining }) : { text: `[UNRECOGNIZED: ${line}]\n${USAGE}\n`, lines: 1 };
    parts.push(r.text);
    used += r.lines;
  }

  let header = `BUDGET: ${used}/${LIMITS.MAX_OUTPUT_LINES} output lines, ${run.length}/${LIMITS.MAX_DIRECTIVES} directives used.`;
  if (dropped.length) {
    header += `\nNOT RUN (over the ${LIMITS.MAX_DIRECTIVES}-directive limit; prioritize and resend):\n${dropped.join("\n")}`;
  }
  return `${header}\n\n${parts.join("\n")}`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const REQ_FILE = path.resolve("tmp/ctx_req.txt");
  const RES_FILE = path.resolve("tmp/ctx_res.txt");
  if (!fs.existsSync(REQ_FILE)) {
    console.error("Missing tmp/ctx_req.txt: paste the model's directive block there first.");
    process.exit(1);
  }
  const text = fulfill(fs.readFileSync(REQ_FILE, "utf8"));
  if (!text) {
    console.error("No READ, OUTLINE, GREP, or TRACE directives found in tmp/ctx_req.txt.");
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(RES_FILE), { recursive: true });
  fs.writeFileSync(RES_FILE, text, "utf8");
  console.log(`Wrote tmp/ctx_res.txt (${text.split("\n")[0]})`);
}
