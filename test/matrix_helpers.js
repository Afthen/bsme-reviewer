/**
 * test/matrix_helpers.js
 * Shared helpers for the derivation matrix test and scripts/trace_case.js:
 * seeded RNG, per-variable unit levels, pairwise covering rows, unit restating,
 * and step collection. Moved verbatim out of derivation_matrix_test.js.
 */

import { parseMathAST } from "../src/cas/ast.js";
import { isolateVariable } from "../src/cas/algebra.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";
import { DIMENSIONS, displayFloorOk } from "../src/core/dimensions.js";
import { candidateUnitsFor } from "../src/core/unit_sampler.js";
import {
  convertUnitValue, getUnitAtomBag, isDimEqual,
  evaluatePhysicalAST, solveUnitAlgebra, isCanonicalScaleFactor
} from "../src/cas/units/index.js";
import { assertDerivationMatchesAnswer, validateDerivationLatex } from "./latex_oracle.js";

export const SEEDS = [1, 2];
export const GEN_SEEDS = [1, 2, 3, 4, 5, 6];
const MAX_LEVELS = 5;

export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function withSeededRandom(seed, fn) {
  const orig = Math.random;
  Math.random = mulberry32(seed);
  try { return fn(); } finally { Math.random = orig; }
}

/** Same-dimension, kind-compatible unit levels for one variable: canonical first, then a seeded sample. */
export const levelStats = { skipped: 0 };

export function unitLevels(canonUnit, meta, rng, canonVal = null) {
  if (!canonUnit || !meta.dimension || canonUnit === "dimless" || canonUnit === "ratio") return [canonUnit];
  const canonBag = getUnitAtomBag(canonUnit, meta.dimension);
  const pool = new Set();
  for (const sys of ["SI", "US"]) {
    for (const p of candidateUnitsFor(sys, meta.dimension, canonUnit)) {
      if (isDimEqual(canonBag.dimMap, getUnitAtomBag(p.unit, meta.dimension).dimMap)) pool.add(p.unit);
    }
  }
  pool.delete(canonUnit);
  // Display floor: drop levels where the restated value would be shown below the floor.
  // The canonical level is always kept.
  if (typeof canonVal === "number" && !meta.isConstant) {
    for (const u of [...pool]) {
      if (!displayFloorOk(convertUnitValue(canonVal, canonUnit, u, meta.dimension))) {
        pool.delete(u);
        levelStats.skipped++;
      }
    }
  }
  const rest = [...pool].sort(() => rng() - 0.5).slice(0, MAX_LEVELS - 1);
  return [canonUnit, ...rest];
}

/** Greedy pairwise covering array over factors with the given level counts. */
export function coveringRows(counts, rng) {
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

export function restate(S, tokens, unitsByTok, varsDb, sys) {
  const S2 = { ...S, sys, _u: { ...S._u } };
  for (const k of tokens) {
    const meta = varsDb[k] || {};
    const from = S._u?.[k] || meta.unit;
    const to = unitsByTok[k];
    if (!to || to === from || typeof S[k] !== "number") continue;
    S2[k] = convertUnitValue(S[k], from, to, meta.dimension);
    S2._u[k] = to;
  }
  return S2;
}

export function collectSteps(topic, sys, S) {
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

/** Shared step-level verifier used by both the pairwise covering matrix and seeded generator checks. */
export function checkStep({
  step,
  S,
  varsDb,
  relations = [],
  allSteps = [step],
  where,
  topicTag = "",
  tags = [],
  changed = 0
}) {
  const failures = [];
  const meta = varsDb[step.targetVar] || {};
  const tUnit = S._u?.[step.targetVar] || meta.unit || "";

  try {
    const rhsAst = parseMathAST(step.rhsExpr);
    const { value } = evaluatePhysicalAST(rhsAst, S, step.targetVar, varsDb, step.requiredUnits);
    const err = Math.abs(value - step.expectedVal) / (Math.abs(step.expectedVal) || 1);
    if (!(err < 1e-3)) {
      failures.push({ layer: "oracle-eval", where, topic: topicTag, tags, changed, msg: `computed ${value}, expected ${step.expectedVal}` });
    }
  } catch (e) {
    failures.push({ layer: "oracle-eval", where, topic: topicTag, tags, changed, msg: e.message });
    return { failures, affineSkipped: false };
  }

  let deriv;
  try {
    deriv = buildAlignedDerivation(step, S, allSteps, varsDb, relations);
  } catch (e) {
    failures.push({ layer: "derivation-throw", where, topic: topicTag, tags, changed, msg: e.message });
    return { failures, affineSkipped: false };
  }

  try {
    validateDerivationLatex(deriv);
  } catch (e) {
    failures.push({ layer: "derivation-latex", where, topic: topicTag, tags, changed, msg: e.message });
  }

  try {
    assertDerivationMatchesAnswer(deriv, step.expectedVal, where, varsDb, tUnit);
  } catch (e) {
    failures.push({
      layer: "derivation-numeric",
      where,
      msg: e.message.split("\n")[0],
      topic: topicTag,
      tags,
      changed,
      row: e.message.split("\n").slice(1).join(" ").trim()
    });
  }

  try {
    const formulaRhs = step.rhsExpr || (step.baseFormula?.includes("=") ? step.baseFormula.split("=")[1].trim() : step.baseFormula) || "";
    const ua = solveUnitAlgebra(formulaRhs, S, step.targetVar, tUnit, varsDb, step.requiredUnits);
    for (const s of ua.conversionScalars || []) {
      if (!isCanonicalScaleFactor(s)) {
        failures.push({ layer: "alien-scalar", where, topic: topicTag, tags, changed, msg: `scalar ${s}` });
      }
    }
  } catch (e) {
    failures.push({ layer: "unit-analysis-throw", where, topic: topicTag, tags, changed, msg: e.message });
  }

  return { failures };
}
