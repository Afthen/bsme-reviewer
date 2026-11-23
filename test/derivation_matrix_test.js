/**
 * test/derivation_matrix_test.js
 * Deterministic step-level derivation matrix. For every topic x system x relation x
 * solvable target it builds the step the way solveDAG does, then re-runs it under a
 * pairwise (2-wise) covering array of unit assignments. Each case is checked against
 * the AST physics oracle (evaluatePhysicalAST) AND the printed derivation. All failures
 * are collected and reported grouped by layer; nothing stops at the first one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAllTopics } from "../src/topics/index.js";
import { isolateVariable } from "../src/cas/algebra.js";
import { parseMathAST } from "../src/cas/ast.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";
import { DIMENSIONS } from "../src/core/dimensions.js";
import { DIMENSION_TOKEN_PALETTES } from "../src/core/unit_sampler.js";
import {
  evaluatePhysicalAST, solveUnitAlgebra, isCanonicalScaleFactor,
  valueToCoherentBase, formatValueInUnit, getUnitAtomBag, isDimEqual
} from "../src/cas/units/index.js";
import { assertDerivationMatchesAnswer } from "./latex_oracle.js";

const SEEDS = [1, 2];
const MAX_LEVELS = 5;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRandom(seed, fn) {
  const orig = Math.random;
  Math.random = mulberry32(seed);
  try { return fn(); } finally { Math.random = orig; }
}

const isDiffMeta = m => m.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!m.isDifference;

function collectCalls(n, acc = new Set()) {
  if (!n) return acc;
  if (n.type === "call") { acc.add(n.fn); collectCalls(n.arg, acc); }
  else if (n.type === "group") collectCalls(n.expr, acc);
  else if (n.type === "binary") { collectCalls(n.left, acc); collectCalls(n.right, acc); }
  return acc;
}

/** Feature tags describing the structural class of a failing step (for clustering). */
function tagsOf(step, tUnit, varsDb) {
  const tags = [];
  if (!tUnit || tUnit === "dimless" || tUnit === "ratio" || tUnit === "%") tags.push("target:dimless");
  for (const fn of collectCalls(parseMathAST(step.rhsExpr))) tags.push(`call:${fn}`);
  if (step.requiredUnits) tags.push("requiredUnits");
  const dims = new Set(step.nodes.map(k => varsDb[k]?.dimension).filter(Boolean));
  if (dims.size > 2) tags.push("mixed-dims");
  for (const d of dims) tags.push(`dim:${d}`);
  return tags;
}

/** Same-dimension unit levels for one variable: canonical first, then a seeded sample of the palettes. */
function unitLevels(canonUnit, meta, rng) {
  if (!canonUnit || !meta.dimension || canonUnit === "dimless" || canonUnit === "ratio") return [canonUnit];
  const canonBag = getUnitAtomBag(canonUnit, meta.dimension);
  const pool = new Set();
  for (const sys of ["SI", "US"]) {
    for (const p of DIMENSION_TOKEN_PALETTES[sys]?.[meta.dimension] || []) {
      if (isDimEqual(canonBag.dimMap, getUnitAtomBag(p.unit, meta.dimension).dimMap)) pool.add(p.unit);
    }
  }
  pool.delete(canonUnit);
  const rest = [...pool].sort(() => rng() - 0.5).slice(0, MAX_LEVELS - 1);
  return [canonUnit, ...rest];
}

/** Greedy pairwise covering array over factors with the given level counts. */
function coveringRows(counts, rng) {
  const n = counts.length;
  const rows = [counts.map(() => 0)];
  const key = (i, a, j, b) => `${i}:${a}|${j}:${b}`;
  const uncovered = new Set();
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    for (let a = 0; a < counts[i]; a++) for (let b = 0; b < counts[j]; b++) uncovered.add(key(i, a, j, b));
  const cover = r => { for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) uncovered.delete(key(i, r[i], j, r[j])); };
  cover(rows[0]);
  let guard = 0;
  while (uncovered.size > 0 && guard++ < 2000) {
    let best = null, bestGain = -1;
    for (let c = 0; c < 24; c++) {
      const r = counts.map(k => Math.floor(rng() * k));
      let gain = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (uncovered.has(key(i, r[i], j, r[j]))) gain++;
      if (gain > bestGain) { best = r; bestGain = gain; }
    }
    rows.push(best);
    cover(best);
  }
  return rows;
}

function restate(S, tokens, unitsByTok, varsDb, sys) {
  const S2 = { ...S, sys, _u: { ...S._u } };
  for (const k of tokens) {
    const meta = varsDb[k] || {};
    const from = S._u?.[k] || meta.unit;
    const to = unitsByTok[k];
    if (!to || to === from || typeof S[k] !== "number") continue;
    const d = isDiffMeta(meta);
    S2[k] = formatValueInUnit(valueToCoherentBase(S[k], from, d, meta.dimension), to, d, meta.dimension);
    S2._u[k] = to;
  }
  return S2;
}

function collectSteps(topic, sys, S) {
  const steps = [];
  for (const rel of topic.relations) {
    const v = rel.variants?.[sys] || null;
    const baseFormula = v?.baseFormula || rel.baseFormula;
    const nodes = v?.nodes || rel.nodes;
    if (!baseFormula) continue;
    for (const targetVar of nodes) {
      if ((topic.varsDb[targetVar] || {}).isConstant) continue;
      const iso = isolateVariable(baseFormula, targetVar, topic.varsDb);
      if (!iso.success || typeof S[targetVar] !== "number") continue;
      steps.push({
        targetVar, id: rel.id, eqId: rel.id, nodes, baseFormula,
        canonicalTex: v?.canonicalTex || rel.canonicalTex || baseFormula,
        requiredUnits: v?.requiredUnits || rel.requiredUnits || null,
        rhsExpr: iso.isolatedRhs, expectedVal: S[targetVar], isFaded: false
      });
    }
  }
  return steps;
}

test("Derivation matrix: every topic x system x relation x target under pairwise unit coverage", async () => {
  const loaded = await loadAllTopics();
  const topics = Array.isArray(loaded) ? loaded : Object.values(loaded);
  const failures = [];
  let cases = 0, affineUnchecked = 0;

  for (const topic of topics) {
    for (const sys of ["SI", "US"]) {
      for (const seed of SEEDS) {
        let S;
        try { S = withSeededRandom(seed, () => topic.createSystem({ sys })); }
        catch (e) { failures.push({ layer: "createSystem", where: `${topic.id}[${sys}]`, msg: e.message }); continue; }

        for (const step of collectSteps(topic, sys, S)) {
          const rng = mulberry32(seed * 7919 + step.targetVar.length);
          const tokens = [...new Set([...step.nodes, step.targetVar])].filter(k => topic.varsDb[k]);
          const levels = tokens.map(k => unitLevels(S._u?.[k] || topic.varsDb[k].unit, topic.varsDb[k], rng));
          const rows = coveringRows(levels.map(l => l.length), rng);

          // Extra row: every token in the target's unit where dimensions agree.
          const tIdx = tokens.indexOf(step.targetVar);
          rows.push(tokens.map((k, i) => {
            const j = levels[i].indexOf(levels[tIdx][0]);
            return j >= 0 ? j : 0;
          }));

          for (const row of rows) {
            cases++;
            const unitsByTok = Object.fromEntries(tokens.map((k, i) => [k, levels[i][row[i]]]));
            const where = `${topic.id}[${sys}] ${step.id} -> ${step.targetVar} {${tokens.map(k => `${k}:${unitsByTok[k]}`).join(", ")}}`;
            const S2 = restate(S, tokens, unitsByTok, topic.varsDb, sys);
            const cur = { ...step, expectedVal: S2[step.targetVar] };
            const tUnit = S2._u?.[step.targetVar] || topic.varsDb[step.targetVar].unit;
            const rhsAst = parseMathAST(step.rhsExpr);

            try {
              const { value } = evaluatePhysicalAST(rhsAst, S2, step.targetVar, topic.varsDb, step.requiredUnits);
              const err = Math.abs(value - cur.expectedVal) / (Math.abs(cur.expectedVal) || 1);
              if (!(err < 1e-3)) failures.push({ layer: "oracle-eval", where, msg: `computed ${value}, expected ${cur.expectedVal}` });
            } catch (e) { failures.push({ layer: "oracle-eval", where, msg: e.message }); continue; }

            let deriv;
            try { deriv = buildAlignedDerivation(cur, S2, [cur], topic.varsDb, topic.relations); }
            catch (e) { failures.push({ layer: "derivation-throw", where, msg: e.message }); continue; }

            const meta = topic.varsDb[step.targetVar];
            const affine = meta.dimension === DIMENSIONS.TEMPERATURE && (tUnit === "°C" || tUnit === "°F");
            if (affine) affineUnchecked++;
            else {
              try { assertDerivationMatchesAnswer(deriv, cur.expectedVal, where, topic.varsDb, tUnit); }
              catch (e) {
                const changed = tokens.filter(k => unitsByTok[k] !== (S._u?.[k] || topic.varsDb[k].unit)).length;
                failures.push({
                  layer: "derivation-numeric", where, msg: e.message.split("\n")[0],
                  topic: `${topic.id}[${sys}]`, tags: tagsOf(step, tUnit, topic.varsDb),
                  changed, row: e.message.split("\n").slice(1).join(" ").trim()
                });
              }
            }

            try {
              const ua = solveUnitAlgebra(step.rhsExpr, S2, step.targetVar, tUnit, topic.varsDb, step.requiredUnits);
              for (const s of ua.conversionScalars || []) {
                if (!isCanonicalScaleFactor(s)) failures.push({ layer: "alien-scalar", where, msg: `scalar ${s}` });
              }
            } catch (e) { failures.push({ layer: "unit-analysis-throw", where, msg: e.message }); }
          }
        }
      }
    }
  }

  // De-duplicate by (layer, topic, relation, target) and print a grouped summary.
  const groups = new Map();
  for (const f of failures) {
    const k = `${f.layer} | ${f.where.split(" {")[0]}`;
    if (!groups.has(k)) groups.set(k, { n: 0, example: f });
    groups.get(k).n++;
  }
  const byLayer = {};
  for (const f of failures) byLayer[f.layer] = (byLayer[f.layer] || 0) + 1;
  console.log(`\n[matrix] ${cases} cases, ${failures.length} failures, ${affineUnchecked} affine-target derivations numerically unchecked`);
  console.log("[matrix] failures by layer:", byLayer);
  const count = (keyFn) => {
    const m = new Map();
    for (const f of failures) for (const k of [].concat(keyFn(f) ?? [])) m.set(k, (m.get(k) || 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  console.log("[matrix] by topic:", count(f => f.topic));
  console.log("[matrix] by tag:", count(f => f.tags));
  const nonDim = f => (f.tags || []).filter(t => !t.startsWith("dim:")).sort().join(" + ") || "(none)";
  console.log("[matrix] by structural class (top 15):", count(nonDim).slice(0, 15));
  console.log("[matrix] failures with all tokens in canonical units:", failures.filter(f => f.changed === 0).length);
  const minimal = new Map();
  for (const f of failures) {
    if (f.layer !== "derivation-numeric") continue;
    const k = f.where.split(" {")[0];
    if (!minimal.has(k) || f.changed < minimal.get(k).changed) minimal.set(k, f);
  }
  const mins = [...minimal.values()].sort((a, b) => a.changed - b.changed);
  console.log(`[matrix] distinct failing (relation,target): ${mins.length}`);
  for (const f of mins.slice(0, 40)) {
    console.log(`[matrix] MIN changed=${f.changed} ${f.where} | ${f.msg.slice(0, 120)} | ROW: ${f.row.slice(0, 260)}`);
  }
  for (const [k, g] of groups) console.log(`  ${k}  x${g.n}\n      e.g. ${g.example.where}\n      ${g.example.msg}`);

  assert.equal(failures.length, 0, `${failures.length} matrix failures (see summary above)`);
});
