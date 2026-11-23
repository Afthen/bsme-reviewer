/**
 * test/ctx_test.js
 * Regression tests for scripts/fulfill_ctx.js and scripts/lib/symbols.js:
 * symbol extraction, symbol-addressed READ, range snapping, out-of-range
 * feedback, budget enforcement, large-file outlining, and GREP context.
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
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
    for (let i = 0; i < 148; i++) out.push("  // pad");
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

  test("READ path#symbol returns the exact body", () => {
    const out = run("READ lib.js#K");
    assert.match(out, /lines 11-14 of 18/);
    assert.match(out, /11: export const K = \[/);
    assert.doesNotMatch(out, /later/);
  });

  test("unknown symbol suggests alternatives", () => {
    assert.match(run("READ lib.js#ad"), /Similar: add/);
    assert.match(run("READ lib.js#zzz"), /Available: add, K, later/);
  });

  test("range cutting a small symbol snaps to its boundaries and says so", () => {
    const out = run("READ lib.js:6-7");
    assert.match(out, /lines 4-9 of 18/);
    assert.match(out, /requested 6-7/);
    assert.match(out, /snapped to add/);
  });

  test("range cutting a huge symbol is not snapped but is reported", () => {
    const out = run("READ big.js:50-60");
    assert.match(out, /lines 50-60 of 450/);
    assert.match(out, /too large to snap/);
  });

  test("out-of-range requests give feedback instead of silent clamping", () => {
    assert.match(run("READ lib.js:500-600"), /file has 18 lines/);
    assert.match(run("READ lib.js:10-99"), /requested end 99, file has 18 lines/);
  });

  test("bare READ of a large file returns an outline, not the dump", () => {
    const out = run("READ big.js");
    assert.match(out, /exceeds 400/);
    assert.match(out, /export fn f1/);
    assert.doesNotMatch(out, /\/\/ pad/);
  });

  test("directive cap lists what was not run", () => {
    const out = run(Array(LIMITS.MAX_DIRECTIVES + 1).fill("OUTLINE lib.js").join("\n"));
    assert.match(out, /NOT RUN/);
  });

  test("line budget refuses oversize reads and supplies the outline", () => {
    const out = run(["READ big.js#f0", "READ big.js#f1", "READ big.js#f2", "READ big.js#f0", "READ big.js#f1"].join("\n"));
    assert.match(out, /SKIPPED/);
    assert.match(out, /OUTLINE: big\.js/);
    assert.match(out, /BUDGET: /);
  });

  test("GREP gives context lines and enclosing symbol tags", () => {
    const out = run("GREP -C 1 return @ lib.js");
    assert.match(out, /2 matches/);
    assert.match(out, /lib\.js:8 \[add\]:/);
    assert.match(out, /lib\.js-7-/);
    assert.match(run("GREP -i RETURN @ ."), /lib\.js:17 \[later\]/);
  });

  test("paths escaping the root and unknown directives are rejected", () => {
    assert.match(run("READ ../secret.txt"), /escapes repository root/);
    assert.match(run("FETCH lib.js"), /UNRECOGNIZED/);
  });
});
