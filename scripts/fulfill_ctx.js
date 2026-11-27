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
import {
  allocateCacheSequence,
  findLineDelivery,
  findOutputDelivery,
  hashText,
  loadContextCache,
  recordLineDelivery,
  recordOutputDelivery,
  resetContextCache,
  saveContextCache
} from "./lib/ctx_cache.js";
import {
  handleGraph,
  handleTopic,
  handleUnit,
  handleConvert,
  handleSolve,
  handleHygiene,
  handleFailures,
  handleDerive,
  handleAuditLatex,
  handleAuditStep,
  handleRenderStep,
  handleProblemSteps,
  handleStepAst,
  handleDiffStep,
  handleDiffDerive,
  handleRoundtripStep
} from "./lib/ctx_tools.js";

export const LIMITS = Object.freeze({
  MAX_DIRECTIVES: 16,
  MAX_OUTPUT_LINES: 1024,
  FULL_READ_MAX: 512,
  SNAP_MAX: 256,
  MAX_GREP_HITS: 64,
  MAX_GREP_CONTEXT: 16,
  MAX_OUTLINE_ENTRIES: 256,
  MAX_LINE_CHARS: 256,
  MAX_TRACE_LINES: 128,
  TRACE_TIMEOUT_MS: 180000
});

const SEARCH_ROOTS = ["app.js", "index.html", "package.json", "src", "styles", "test", "scripts"];
const TEXT_EXT = /\.(?:js|json|html|css|md|txt)$/;
const FENCE = "`".repeat(3);

const fenced = (header, body) => `${header}\n${FENCE}\n${body}\n${FENCE}\n`;
const clip = (s) => (s.length > LIMITS.MAX_LINE_CHARS ? `${s.slice(0, LIMITS.MAX_LINE_CHARS)}…` : s);
const numbered = (lines, a, b) => lines.slice(a - 1, b).map((l, i) => `${a + i}: ${l}`).join("\n");

function sourceBlock(rel, header, lines, a, b, { complete = true, group = 0 } = {}) {
  const text = fenced(header, numbered(lines, a, b));
  const sourceRefs = lines.slice(a - 1, b).map((raw, i) => ({
    rel,
    line: a + i,
    raw,
    complete,
    display: `${a + i}: ${raw}`,
    outputIndex: i + 2,
    group
  }));
  return { text, lines: b - a + 1, sourceRefs };
}

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

const errorBlock = (rel, msg) => ({
  text: `FILE: ${rel}\n[ERROR: ${msg}]\n`,
  lines: 1,
  cacheable: false
});

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
    lines: body.split("\n").length,
    cacheable: false
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
  const invalidCount = blocks.length;
  const uniquePicked = [...new Map(
    picked.map((s) => [`${s.name}:${s.start}:${s.end}`, s])
  ).values()];
  const needed = uniquePicked.reduce((n, s) => n + (s.end - s.start + 1), 0);
  if (needed > remaining) return refuse(rel, f, needed, remaining);

  const refs = [];
  let offset = blocks.reduce((n, block) => n + block.split("\n").length, 0);
  for (let i = 0; i < uniquePicked.length; i++) {
    const s = uniquePicked[i];
    const block = sourceBlock(
      rel,
      `FILE: ${rel}#${s.name} (lines ${s.start}-${s.end} of ${f.lines.length})`,
      f.lines,
      s.start,
      s.end,
      { group: i }
    );
    refs.push(...block.sourceRefs.map((ref) => ({
      ...ref,
      outputIndex: ref.outputIndex + offset
    })));
    blocks.push(block.text);
    offset += block.text.split("\n").length;
  }

  return {
    text: blocks.join("\n"),
    lines: needed + invalidCount,
    sourceRefs: refs
  };
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
        lines: body.split("\n").length,
        cacheable: false
      };
    }
    if (N > remaining) return refuse(rel, f, N, remaining);
    return sourceBlock(rel, `FILE: ${rel} (${N} lines)`, f.lines, 1, N);
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
  return sourceBlock(
    rel,
    `FILE: ${rel} (lines ${a}-${b} of ${N})${noteText}`,
    f.lines,
    a,
    b
  );
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
  if (!term) return { text: "[ERROR: GREP needs a search term]\n", lines: 1, cacheable: false };

  let range = null;
  let files;
  if (scope) {
    const sm = scope.match(/^(.+?)(?::(\d+)-(\d+))?$/);
    if (sm[2]) range = [Number(sm[2]), Number(sm[3])];
    const abs = resolveInRoot(root, sm[1]);
    if (!abs) return {
      text: `[ERROR: scope ${sm[1]} escapes repository root]\n`,
      lines: 1,
      cacheable: false
    };
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
  const sourceRefs = [];
  let truncated = false;
  for (const [rel, { lines, hits }] of byFile) {
    const syms = rel.endsWith(".js") ? extractSymbols(lines.join("\n")) : [];
    const hitSet = new Set(hits);
    const windows = mergeWindows(hits, ctx, lines.length);
    for (let w = 0; w < windows.length && !truncated; w++) {
      if (ctx > 0 && out.length) out.push("--");
      for (let k = windows[w][0]; k <= windows[w][1]; k++) {
        if (out.length >= remaining) { truncated = true; break; }
        const isHit = hitSet.has(k);
        const sym = isHit ? findEnclosing(syms, k + 1) : null;
        const display = isHit
          ? `${rel}:${k + 1}${sym ? ` [${sym.name}]` : ""}: ${clip(lines[k].trim())}`
          : `${rel}-${k + 1}- ${clip(lines[k].trim())}`;
        const outputIndex = out.length + 2;
        out.push(display);
        sourceRefs.push({
          rel,
          line: k + 1,
          raw: lines[k],
          complete: false,
          display,
          outputIndex,
          group: 0
        });
      }
    }
    if (truncated) break;
  }

  const where = scope ? `, scope ${scope}` : "";
  const cap = total > shown ? `, showing first ${shown}` : "";
  const trunc = truncated ? "\n[output truncated by line budget; narrow with @ path]" : "";
  return {
    text: fenced(`GREP: "${term}" (${total} matches${cap}${where})`, (out.join("\n") || "(no matches)") + trunc),
    lines: Math.max(1, out.length),
    sourceRefs
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

const HANDLERS = {
  READ: handleRead,
  OUTLINE: handleOutline,
  GREP: handleGrep,
  TRACE: handleTrace,
  GRAPH: handleGraph,
  TOPIC: handleTopic,
  UNIT: handleUnit,
  CONVERT: handleConvert,
  SOLVE: handleSolve,
  HYGIENE: handleHygiene,
  FAILURES: handleFailures,
  DERIVE: handleDerive,
  "AUDIT-LATEX": handleAuditLatex,
  "AUDIT-STEP": handleAuditStep,
  "RENDER-STEP": handleRenderStep,
  "PROBLEM-STEPS": handleProblemSteps,
  "STEP-AST": handleStepAst,
  "DIFF-STEP": handleDiffStep,
  "DIFF-DERIVE": handleDiffDerive,
  "ROUNDTRIP-STEP": handleRoundtripStep
};
const USAGE = "Valid: READ, OUTLINE, GREP, TRACE, GRAPH, TOPIC, UNIT, CONVERT, SOLVE, HYGIENE, FAILURES, DERIVE, AUDIT-LATEX, AUDIT-STEP, RENDER-STEP, PROBLEM-STEPS, STEP-AST, DIFF-STEP, DIFF-DERIVE, ROUNDTRIP-STEP";

export function parseDirectives(raw) {
  return raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith(FENCE));
}

function analyzeSourceResult(res, cache) {
  const refs = res.sourceRefs || [];
  if (!refs.length) {
    return { res, cachedCount: 0, markerCount: 0, newRefs: [] };
  }

  const cached = [];
  const newRefs = [];
  const seen = new Set();

  for (const ref of refs) {
    const key = `${ref.rel}\0${ref.line}`;
    const previous = findLineDelivery(cache, ref);

    if (previous) {
      cached.push({ ref, seq: previous.seq });
    } else if (seen.has(key)) {
      cached.push({ ref, seq: null });
    } else {
      seen.add(key);
      newRefs.push(ref);
    }
  }

  if (!cached.length) {
    return {
      res: { ...res, sourceRefs: newRefs },
      cachedCount: 0,
      markerCount: 0,
      newRefs
    };
  }

  const lines = res.text.split("\n");
  const groups = new Map();
  for (const item of cached) {
    const group = item.ref.group ?? 0;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }

  const markers = new Map();
  const removed = new Set();

  for (const [group, items] of groups) {
    items.sort((a, b) => a.ref.outputIndex - b.ref.outputIndex);
    const indexes = items.map((item) => item.ref.outputIndex);
    const deliveries = [...new Set(items.map((item) => item.seq).filter(Number.isInteger))];
    const deliveryText = deliveries.length
      ? ` (earlier ${deliveries.length > 1 ? "deliveries" : "delivery"}: ${deliveries.join(", ")})`
      : "";

    markers.set(
      indexes[0],
      `[CACHED: ${items.length} source line(s) already included${deliveryText}]`
    );

    for (const index of indexes.slice(1)) removed.add(index);
  }

  const compactLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (markers.has(i)) compactLines.push(markers.get(i));
    else if (!removed.has(i)) compactLines.push(lines[i]);
  }

  return {
    res: {
      ...res,
      text: compactLines.join("\n"),
      lines: Math.max(1, res.lines - cached.length + groups.size),
      sourceRefs: newRefs
    },
    cachedCount: cached.length,
    markerCount: groups.size,
    newRefs
  };
}

/**
 * Prepares a response and a deferred ledger commit.
 * The caller commits only after its response file has been written successfully.
 */
export async function prepareFulfillment(raw, {
  root = process.cwd(),
  cache: useCache = false
} = {}) {
  const directives = parseDirectives(raw);
  if (directives.length === 0) return { text: "", commit() {} };

  const cache = useCache ? loadContextCache(root) : null;
  const deliverySeq = cache ? allocateCacheSequence(cache) : null;
  const run = directives.slice(0, LIMITS.MAX_DIRECTIVES);
  const dropped = directives.slice(LIMITS.MAX_DIRECTIVES);
  const parts = [];
  let used = 0;
  const DIRECTIVE_RE = /^(READ|OUTLINE|GREP|TRACE|GRAPH|TOPIC|UNIT|CONVERT|SOLVE|HYGIENE|FAILURES|DERIVE|AUDIT-LATEX|AUDIT-STEP|RENDER-STEP|PROBLEM-STEPS|STEP-AST|DIFF-STEP|DIFF-DERIVE|ROUNDTRIP-STEP)(?:\s+(.*))?$/;

  for (const line of run) {
    const remaining = Math.max(0, LIMITS.MAX_OUTPUT_LINES - used);
    const m = line.match(DIRECTIVE_RE);
    let r;

    if (m) {
      const verb = m[1];
      const arg = (m[2] || "").trim();

      try {
        if (cache && (verb === "READ" || verb === "GREP")) {
          let res = HANDLERS[verb](arg, { root, remaining: Number.MAX_SAFE_INTEGER });
          let analyzed = analyzeSourceResult(res, cache);

          if (analyzed.res.lines > remaining && (res.sourceRefs || []).length) {
            const overhead = Math.max(0, res.lines - res.sourceRefs.length);
            const retryRemaining = Math.max(
              0,
              remaining + analyzed.cachedCount - analyzed.markerCount - overhead
            );
            res = HANDLERS[verb](arg, { root, remaining: retryRemaining });
            analyzed = analyzeSourceResult(res, cache);
          }

          r = analyzed.res;

          if (analyzed.newRefs.length) {
            for (const ref of analyzed.newRefs) {
              recordLineDelivery(cache, ref, deliverySeq);
            }
          }
        } else {
          const result = HANDLERS[verb](arg, { root, remaining });
          r = result instanceof Promise ? await result : result;

          if (cache && verb !== "READ" && verb !== "GREP" &&
              r.cacheable !== false && r.text) {
            const outputHash = hashText(r.text);
            const previous = findOutputDelivery(cache, outputHash);

            if (previous) {
              r = {
                text: `[CACHED: identical ${verb} result already delivered in context delivery ${previous.seq}]\n`,
                lines: 1
              };
            } else {
              recordOutputDelivery(cache, outputHash, deliverySeq);
            }
          }
        }
      } catch (err) {
        r = { text: `[${verb} ERROR: ${err.message}]\n`, lines: 1, cacheable: false };
      }
    } else {
      r = { text: `[UNRECOGNIZED: ${line}]\n${USAGE}\n`, lines: 1, cacheable: false };
    }

    parts.push(r.text);
    used += r.lines;
  }

  const budgetText = `BUDGET: ${used}/${LIMITS.MAX_OUTPUT_LINES} output lines, ${run.length}/${LIMITS.MAX_DIRECTIVES} directives used.`;
  let header = deliverySeq !== null ? `DELIVERY: ${deliverySeq} | ${budgetText}` : budgetText;
  if (dropped.length) {
    header += `\nNOT RUN (over the ${LIMITS.MAX_DIRECTIVES}-directive limit; prioritize and resend):\n${dropped.join("\n")}`;
  }

  return {
    text: `${header}\n\n${parts.join("\n")}`,
    commit() {
      if (cache) saveContextCache(cache);
    }
  };
}

/** Fulfills a raw request; caching is opt-in for programmatic callers. */
export async function fulfill(raw, options = {}) {
  const prepared = await prepareFulfillment(raw, options);
  prepared.commit();
  return prepared.text;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const REQ_FILE = path.resolve("tmp/ctx_req.txt");
  const RES_FILE = path.resolve("tmp/ctx_res.txt");
  const args = process.argv.slice(2);

  if (args.includes("--reset")) {
    resetContextCache();
    if (args.length === 1) {
      console.log("Reset tmp/ctx_cache.txt.");
      process.exit(0);
    }
  }

  if (!fs.existsSync(REQ_FILE)) {
    console.error("Missing tmp/ctx_req.txt: paste the model's directive block there first.");
    process.exit(1);
  }

  const prepared = await prepareFulfillment(fs.readFileSync(REQ_FILE, "utf8"), { cache: true });
  if (!prepared.text) {
    console.error("No READ, OUTLINE, GREP, or TRACE directives found in tmp/ctx_req.txt.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(RES_FILE), { recursive: true });
  const tempFile = `${RES_FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tempFile, prepared.text, "utf8");
  fs.renameSync(tempFile, RES_FILE);
  prepared.commit();
  console.log(`Wrote tmp/ctx_res.txt (${prepared.text.split("\n")[0]})`);
}
