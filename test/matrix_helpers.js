/**
 * test/matrix_helpers.js
 * Shared helpers for the derivation matrix test and scripts/trace_case.js:
 * seeded RNG, per-variable unit levels, pairwise covering rows, unit restating,
 * and step collection. Moved verbatim out of derivation_matrix_test.js.
 */

import { isolateVariable } from "../src/cas/algebra.js";
import { DIMENSIONS } from "../src/core/dimensions.js";
import { DIMENSION_TOKEN_PALETTES } from "../src/core/unit_sampler.js";
import { valueToCoherentBase, formatValueInUnit, getUnitAtomBag, isDimEqual } from "../src/cas/units/index.js";

export const SEEDS = [1, 2];
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

const isDiffMeta = m => m.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!m.isDifference;

/** Same-dimension unit levels for one variable: canonical first, then a seeded sample of the palettes. */
export function unitLevels(canonUnit, meta, rng) {
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
    const d = isDiffMeta(meta);
    S2[k] = formatValueInUnit(valueToCoherentBase(S[k], from, d, meta.dimension), to, d, meta.dimension);
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
