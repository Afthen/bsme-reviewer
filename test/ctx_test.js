/**
 * test/ctx_test.js
 * Regression tests for scripts/fulfill_ctx.js and scripts/lib/symbols.js:
 * symbol extraction, symbol-addressed READ, range snapping, out-of-range
 * feedback, budget enforcement, large-file outlining, and GREP context.
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { extractSymbols } from "../scripts/lib/symbols.js";
import { fulfill, LIMITS } from "../scripts/fulfill_ctx.js";

const SAMPLE = [
  "/** header */",
  "import x from 'y';",
  "",
  "// adds",
  "export function add(a, b) {",
  "  const s = \"}\";",
  "  const r = /[\"'}]/g;",
  "  return `${a}{` + b;",
  "}",
  "",
  "export const K = [",
  "  1,",
  "  2",
  "];",
  "",
  "async function later() {",
  "  return 1;",
  "}"
].join("\n");

function bigSource() {
  const out = [];
  for (let k = 0; k < 3; k++) {
    out.push(`export function f${k}() {`);
    for (let i = 0; i < 208; i++) out.push("  // pad");
    out.push("}");
  }
  return out.join("\n");
}

describe("symbols.extractSymbols", () => {
  test("exact ranges despite braces in strings, regex, and templates", () => {
    const syms = Object.fromEntries(extractSymbols(SAMPLE).map((s) => [s.name, s]));
    assert.deepEqual([syms.add.start, syms.add.end], [4, 9]);
    assert.deepEqual([syms.K.start, syms.K.end], [11, 14]);
    assert.deepEqual([syms.later.start, syms.later.end], [16, 18]);
    assert.equal(syms.add.exported, true);
    assert.equal(syms.later.exported, false);
  });

  test("every symbol in the real repo has a sane range", () => {
    const roots = ["app.js", "src", "scripts", "test"];
    const walk = (p, acc = []) => {
      if (!fs.existsSync(p)) return acc;
      const st = fs.statSync(p);
      if (st.isFile() && p.endsWith(".js")) acc.push(p);
      else if (st.isDirectory()) for (const e of fs.readdirSync(p)) if (e !== "node_modules" && !e.startsWith(".")) walk(path.join(p, e), acc);
      return acc;
    };
    for (const file of roots.flatMap((r) => walk(r))) {
      const text = fs.readFileSync(file, "utf8");
      const total = text.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n").length;
      for (const s of extractSymbols(text)) {
        assert.ok(s.start >= 1 && s.start <= s.declLine && s.declLine <= s.end && s.end <= total, `${file}: bad range for ${s.name} ${s.start}-${s.end}`);
      }
    }
    const names = extractSymbols(fs.readFileSync("src/mastery/constants.js", "utf8")).map((s) => s.name);
    assert.ok(names.includes("phi") && names.includes("fib"));
  });
});

describe("fulfill_ctx", () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-"));
    fs.writeFileSync(path.join(root, "lib.js"), SAMPLE);
    fs.writeFileSync(path.join(root, "big.js"), bigSource());
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  const run = (req) => fulfill(req, { root });

  test("READ path#symbol returns the exact body", async () => {
    const out = await run("READ lib.js#K");
    assert.match(out, /lines 11-14 of 18/);
    assert.match(out, /11: export const K = \[/);
    assert.doesNotMatch(out, /later/);
  });

  test("unknown symbol suggests alternatives", async () => {
    assert.match(await run("READ lib.js#ad"), /Similar: add/);
    assert.match(await run("READ lib.js#zzz"), /Available: add, K, later/);
  });

  test("range cutting a small symbol snaps to its boundaries and says so", async () => {
    const out = await run("READ lib.js:6-7");
    assert.match(out, /lines 4-9 of 18/);
    assert.match(out, /requested 6-7/);
    assert.match(out, /snapped to add/);
  });

  test("range cutting a huge symbol is not snapped but is reported", async () => {
    const out = await run("READ big.js:50-60");
    assert.match(out, /lines 50-60 of 630/);
    assert.match(out, /too large to snap/);
  });

  test("out-of-range requests give feedback instead of silent clamping", async () => {
    assert.match(await run("READ lib.js:500-600"), /file has 18 lines/);
    assert.match(await run("READ lib.js:10-99"), /requested end 99, file has 18 lines/);
  });

  test("bare READ of a large file returns an outline, not the dump", async () => {
    const out = await run("READ big.js");
    assert.match(out, /exceeds 512/);
    assert.match(out, /export fn f1/);
    assert.doesNotMatch(out, /\/\/ pad/);
  });

  test("directive cap lists what was not run", async () => {
    const out = await run(Array(LIMITS.MAX_DIRECTIVES + 1).fill("OUTLINE lib.js").join("\n"));
    assert.match(out, /NOT RUN/);
  });

  test("line budget refuses oversize reads and supplies the outline", async () => {
    const out = await run(["READ big.js#f0", "READ big.js#f1", "READ big.js#f2", "READ big.js#f0", "READ big.js#f1"].join("\n"));
    assert.match(out, /SKIPPED/);
    assert.match(out, /OUTLINE: big\.js/);
    assert.match(out, /BUDGET: /);
  });

  test("GREP gives context lines and enclosing symbol tags", async () => {
    const out = await run("GREP -C 1 return @ lib.js");
    assert.match(out, /2 matches/);
    assert.match(out, /lib\.js:8 \[add\]:/);
    assert.match(out, /lib\.js-7-/);
    assert.match(await run("GREP -i RETURN @ ."), /lib\.js:17 \[later\]/);
  });

  test("paths escaping the root and unknown directives are rejected", async () => {
    assert.match(await run("READ ../secret.txt"), /escapes repository root/);
    assert.match(await run("FETCH lib.js"), /UNRECOGNIZED/);
  });
});

describe("fulfill new context tools", () => {
  test("UNIT inspects 7D dimensional vector and base scale", async () => {
    const out = await fulfill("UNIT Btu/h");
    assert.match(out, /7D Dimension Vector/);
    assert.match(out, /Base Scale Factor/);
  });

  test("CONVERT decomposes conversion and verifies canonical scale factor", async () => {
    const out = await fulfill("CONVERT Btu/h -> W");
    assert.match(out, /Dimensional Match: YES/);
    assert.match(out, /CANONICAL/);
    assert.doesNotMatch(out, /\[object Object\]/);
  });

  test("SOLVE isolates target variable algebraically via CAS AST", async () => {
    const out = await fulfill('SOLVE "P * V = m * R * T" T');
    assert.match(out, /Status: SUCCESS/);
    assert.match(out, /T =/);
  });

  test("TOPIC prints schema and contract overview", async () => {
    const out = await fulfill("TOPIC diesel_cycle");
    assert.match(out, /powerplant_design_diesel_cycle/);
    assert.match(out, /varsDb/);
    assert.match(out, /Relations/);
  });

  test("GRAPH unrolls bipartite reachability and solution path", async () => {
    const out = await fulfill("GRAPH diesel_cycle givens=T_1,r_k,r_c,k,c_p,c_v target=W_net");
    assert.match(out, /Unrolled Solution Path/);
    assert.match(out, /Reachable: YES/);
  });

  test("DERIVE renders single-step derivation with 4-row tower metrics and honors unit restates", async () => {
    const out = await fulfill("DERIVE diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Visual Fraction Depth/);
    assert.match(out, /Tower Cap Compliance: PASS/);

    const restated = await fulfill("DERIVE bypass_air eq_mixed_temp_bal t_r {m_m:kg/min, m_o:kg/min, m_r:kg/h}");
    assert.match(restated, /Oracle Match: PASS/);
    assert.doesNotMatch(restated, /\[6pt\]/);

    const badTarget = await fulfill("DERIVE bypass_air eq_bf_temp nope");
    assert.match(badTarget, /Valid targets:/);
  });

  test("AUDIT-STEP checks visual and structural invariants without regex surgery", async () => {
    const out = await fulfill("AUDIT-STEP diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Audit Checks Run/);
    assert.match(out, /Audit Status:/);
  });

  test("PROBLEM-STEPS outputs full multi-step sequence with cognitive fading", async () => {
    const out = await fulfill("PROBLEM-STEPS diesel_cycle sys=SI seed=1");
    assert.match(out, /Problem Deliverable: (?!undefined)/);
    assert.doesNotMatch(out, /Givens: 0 =/);
    assert.match(out, /Steps Sequence \([1-9]\d* total\)/);
  });

  test("FAILURES summarizes derivation matrix clean status or clusters", async () => {
    const out = await fulfill("FAILURES diesel_cycle");
    assert.match(out, /derivation matrix/);
    assert.match(out, /Matrix Status:/);
  });

  test("HYGIENE checks topic schema orphans and degree symbols", async () => {
    const out = await fulfill("HYGIENE diesel_cycle");
    assert.match(out, /Auditing hygiene/);
    assert.match(out, /Hygiene Status:/);
  });

  test("AUDIT-LATEX flags formatting inconsistencies in raw string or topic", async () => {
    const out = await fulfill("AUDIT-LATEX \\text{ 1000 kW}");
    assert.match(out, /Leading space inside/);
  });

  test("RENDER-STEP simulates wireframe progression breakdown", async () => {
    const out = await fulfill("RENDER-STEP diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Visual Wireframe Layout/);
    assert.match(out, /Symbolic Formula/);
  });

  test("STEP-AST outputs dual AST node hierarchy and serialized KaTeX", async () => {
    const out = await fulfill("STEP-AST diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Semantic AST Hierarchy/);
    assert.match(out, /BinaryOp/);
  });

  test("DIFF-STEP structurally diffs two isolated formulas or targets", async () => {
    const out = await fulfill("DIFF-STEP diesel_cycle eq_diesel_t2 T_2 vs T_1");
    assert.match(out, /Diffing Inverted Steps/);
    assert.match(out, /AST for T_2/);
  });

  test("DIFF-DERIVE shows line-by-line LaTeX derivation comparison across systems", async () => {
    const out = await fulfill("DIFF-DERIVE diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Derivation Diff/);
    assert.match(out, /SI \(Line-by-Line\)/);
  });

  test("ROUNDTRIP-STEP verifies exact identity between AST physics and LaTeX derivation", async () => {
    const out = await fulfill("ROUNDTRIP-STEP diesel_cycle eq_diesel_t2 T_2");
    assert.match(out, /Roundtrip Identity Test/);
    assert.match(out, /Roundtrip Status:/);
  });
});

describe("context delivery cache", () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-cache-"));
    fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
    fs.writeFileSync(path.join(root, "lib.js"), SAMPLE);
    fs.writeFileSync(
      path.join(root, "plain.txt"),
      Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n")
    );
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  const runCached = (request) => fulfill(request, { root, cache: true });
  const cachePath = () => path.join(root, "tmp", "ctx_cache.txt");

  test("exact duplicate READ is replaced by a marker and ledger contains no source text", async () => {
    const first = await runCached("READ lib.js#K");
    assert.match(first, /11: export const K/);

    const second = await runCached("READ lib.js#K");
    assert.match(second, /CACHED: 4 source line/);
    assert.doesNotMatch(second, /11: export const K/);

    const ledger = fs.readFileSync(cachePath(), "utf8");
    assert.doesNotMatch(ledger, /export const K/);
    assert.match(ledger, /^# ctx-cache-v1/m);
  });

  test("partial overlap sends only unseen source lines", async () => {
    await runCached("READ plain.txt:1-5");
    const second = await runCached("READ plain.txt:4-8");

    assert.match(second, /CACHED: 2 source line/);
    assert.doesNotMatch(second, /4: line 4/);
    assert.doesNotMatch(second, /5: line 5/);
    assert.match(second, /6: line 6/);
    assert.match(second, /8: line 8/);
  });

  test("changed source line is delivered again", async () => {
    await runCached("READ plain.txt:1-3");

    fs.writeFileSync(
      path.join(root, "plain.txt"),
      ["line 1", "line 2 changed", "line 3", ...Array.from({ length: 7 }, (_, i) => `line ${i + 4}`)].join("\n")
    );

    const second = await runCached("READ plain.txt:1-3");
    assert.match(second, /2: line 2 changed/);
  });

  test("symbol movement to a new line range is delivered again", async () => {
    await runCached("READ lib.js#K");
    fs.writeFileSync(path.join(root, "lib.js"), `// inserted line\n${SAMPLE}`);

    const second = await runCached("READ lib.js#K");
    assert.match(second, /lines 12-15 of 19/);
    assert.match(second, /12: export const K/);
  });

  test("a GREP excerpt does not suppress a later full READ", async () => {
    await runCached("GREP export function @ lib.js");
    const second = await runCached("READ lib.js:5-9");

    assert.match(second, /5: export function add/);
    assert.match(second, /8:   return/);
  });

  test("computed directives rerun and deduplicate by exact output", async () => {
    const first = await runCached("OUTLINE lib.js");
    assert.match(first, /OUTLINE: lib.js/);

    const second = await runCached("OUTLINE lib.js");
    assert.match(second, /CACHED: identical OUTLINE result/);
    assert.doesNotMatch(second, /export fn add/);
  });

  test("--reset clears the ledger even when no request file exists", async () => {
    await runCached("READ plain.txt:1-2");
    assert.equal(fs.existsSync(cachePath()), true);

    const script = path.resolve("scripts/fulfill_ctx.js");
    execFileSync(process.execPath, [script, "--reset"], { cwd: root });

    assert.equal(fs.existsSync(cachePath()), false);
  });

  test("generating a new skeleton clears the previous context ledger", async () => {
    await runCached("READ plain.txt:1-2");
    assert.equal(fs.existsSync(cachePath()), true);

    const script = path.resolve("scripts/repo_skeleton.js");
    execFileSync(process.execPath, [script], { cwd: root });

    assert.equal(fs.existsSync(cachePath()), false);
    assert.equal(fs.existsSync(path.join(root, "tmp", "skeleton.txt")), true);
  });
});
