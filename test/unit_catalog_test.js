/**
 * test/unit_catalog_test.js
 * Catalog derived from the registry, chip round-trips, canonical factor trains
 * (checked numerically by the LaTeX oracle), and the interactive-unit statement spans.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASE_UNITS, PREFIXES, getUnitAtomBag, isDimEqual, parseUnitToSemanticAST
} from "../src/cas/units/index.js";
import {
  getCategories, ENTRY_BY_ID, composeUnit, chipsFromUnit, buildConversion
} from "../src/core/unit_catalog.js";
import { ORACLE_REL_TOLERANCE, ORACLE_ABS_TOLERANCE, targetLabel } from "../src/core/dimensions.js";
import { generateProblem } from "../src/core/problem_gen.js";
import { loadAllTopics } from "../src/topics/index.js";
import { evalLatexMathToNumber, validateStatementLatex } from "./latex_oracle.js";
import { withSeededRandom } from "./matrix_helpers.js";

const cats = getCategories();
const near = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(b) * ORACLE_REL_TOLERANCE, ORACLE_ABS_TOLERANCE);

test("Every registered base unit lands in exactly one category", () => {
  const seen = new Map();
  cats.forEach(c => c.entries.filter(e => e.kind === "base").forEach(e => seen.set(e.id, (seen.get(e.id) || 0) + 1)));
  for (const key of Object.keys(BASE_UNITS)) assert.equal(seen.get(key), 1, `${key} must appear once`);
});

test("Every entry resolves, matches its category dimensions, and every offered prefix parses", () => {
  for (const c of cats) {
    for (const e of c.entries) {
      const bag = getUnitAtomBag(e.unit);
      assert.equal(bag.isUnknown, false, `${e.id} unknown`);
      assert.ok(isDimEqual(bag.dimMap, c.dimMap), `${e.id} in wrong category ${c.label}`);
      for (const code of e.prefixes) {
        const ast = parseUnitToSemanticAST(`${code}${e.unit}`);
        assert.equal(ast[0].prefix, PREFIXES[code].name, `${code}${e.unit}`);
      }
    }
  }
});

test("chipsFromUnit and composeUnit round-trip every entry", () => {
  for (const e of ENTRY_BY_ID.values()) {
    const chips = chipsFromUnit(e.unit);
    assert.ok(chips, `${e.id} not representable as chips`);
    const a = getUnitAtomBag(e.unit);
    const b = getUnitAtomBag(composeUnit(chips));
    assert.ok(isDimEqual(a.dimMap, b.dimMap), e.id);
    assert.ok(Math.abs(a.scale - b.scale) <= 1e-12 * Math.abs(a.scale), `${e.id} scale drift`);
  }
});

test("Same-category conversions use only canonical scalars and match the numeric oracle", () => {
  for (const c of cats) {
    const units = c.entries.map(e => e.unit).filter(u => getUnitAtomBag(u).kind !== "point");
    for (const from of units) {
      for (const to of units) {
        if (from === to) continue;
        const res = buildConversion(from, to, 7.5);
        assert.equal(res.ok, true, `${from} -> ${to}: ${res.reason}`);
        assert.equal(res.canonical, true, `${from} -> ${to} emitted non-canonical scalars ${res.scalars}`);
        const a = getUnitAtomBag(from), b = getUnitAtomBag(to);
        assert.ok(near(res.result, 7.5 * a.scale / b.scale), `${from} -> ${to} numeric result`);
        const got = evalLatexMathToNumber(res.lhsTex);
        assert.ok(near(got, res.result), `${from} -> ${to}: train evaluates to ${got}, result ${res.result}\n${res.lhsTex}`);
      }
    }
  }
});

test("Registry vectors and scales equal what the engine resolves from each unit symbol", () => {
  for (const [id, meta] of Object.entries(BASE_UNITS)) {
    const bag = getUnitAtomBag(meta.symbol);
    assert.equal(bag.isUnknown, false, `${id} unknown`);
    assert.ok(isDimEqual(bag.dimMap, meta.dimMap), `${id}: registry ${JSON.stringify(meta.dimMap)} vs resolved ${JSON.stringify(bag.dimMap)}`);
    assert.ok(Math.abs(bag.scale - meta.baseScale) <= 1e-12 * Math.abs(meta.baseScale), `${id}: scale ${bag.scale} vs ${meta.baseScale}`);
  }
});

test("Temperature points convert affinely; point/delta and dimension mismatches are refused", () => {
  const cf = buildConversion("°C", "°F", 100);
  assert.equal(cf.ok, true);
  assert.ok(near(cf.result, 212));
  assert.ok(near(evalLatexMathToNumber(cf.lhsTex), 212));
  const pd = buildConversion("°C", "Δ°C", 5);
  assert.equal(pd.ok, false);
  assert.match(pd.reason, /Cannot convert/);
  const dm = buildConversion("kW", "N", 5);
  assert.equal(dm.ok, false);
  assert.equal(dm.reason, "Dimensions differ");
});

test("targetLabel wraps the unit in an interactive span only when a variable is given", () => {
  assert.equal(
    targetLabel("Load", "$F$", "lb_f", "\\text{lb}_{f}", "F"),
    'Load ($F$) in <span class="interactive-unit" data-var="F">$\\text{lb}_{f}$</span>'
  );
  assert.equal(targetLabel("Load", "$F$", "lb_f", "\\text{lb}_{f}"), "Load ($F$) in $\\text{lb}_{f}$");
});

test("Problem statements carry valid interactive-unit spans and still render", async () => {
  const topics = await loadAllTopics();
  let total = 0;
  for (const topic of topics) {
    const problem = withSeededRandom(1, () => generateProblem(topic, () => 0, { mode: "SI" }));
    validateStatementLatex(problem.statement, topic.id);
    const keys = problem.statement.split('class="interactive-unit" data-var="').slice(1).map(s => s.slice(0, s.indexOf('"')));
    for (const k of keys) {
      assert.ok(problem.varsDb[k] || problem.system[k] !== undefined, `${topic.id}: unit span for unknown variable ${k}`);
    }
    total += keys.length;
  }
  assert.ok(total > 0, "no interactive-unit span was emitted by any topic");
});
