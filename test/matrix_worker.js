/**
 * test/matrix_worker.js
 * Parallel worker evaluating derivation matrix Layers 1 & 2 for a subset of topics.
 * Applies KaTeX structural template memoization and deterministic-system seed deduplication.
 */

import { parentPort, workerData } from "node:worker_threads";
import assert from "node:assert/strict";
import { loadTopics } from "../src/topics/index.js";
import { parseMathAST } from "../src/cas/ast.js";
import { generateProblem } from "../src/core/problem_gen.js";
import { valueToCoherentBase, formatValueInUnit } from "../src/cas/units/index.js";
import { validateDerivationLatex, validateStatementLatex } from "./latex_oracle.js";
import {
  SEEDS, GEN_SEEDS, mulberry32, withSeededRandom,
  unitLevels, coveringRows, restate, collectSteps, checkStep, levelStats
} from "./matrix_helpers.js";

function collectCalls(n, acc = new Set()) {
  if (!n) return acc;
  if (n.type === "call") { acc.add(n.fn); collectCalls(n.arg, acc); }
  else if (n.type === "group") collectCalls(n.expr, acc);
  else if (n.type === "binary") { collectCalls(n.left, acc); collectCalls(n.right, acc); }
  return acc;
}

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

function normalizeLatexStructure(derivLatex) {
  return derivLatex.replace(/[+-]?\d[\d.,{}]*(?:e[+-]?\d+)?/gi, "0");
}

function sameSystemState(a, b) {
  if (!a || !b) return false;
  const keysA = Object.keys(a).filter(k => !k.startsWith("_")).sort();
  const keysB = Object.keys(b).filter(k => !k.startsWith("_")).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const k = keysA[i];
    if (k !== keysB[i] || a[k] !== b[k] || a._u?.[k] !== b._u?.[k]) return false;
  }
  return true;
}

export async function runMatrixForTopicIds(topicIds) {
  const topics = await loadTopics(topicIds);
  const seenLatexTemplates = new Set();
  const validateLatexFast = (derivLatex) => {
    const tpl = normalizeLatexStructure(derivLatex);
    if (!seenLatexTemplates.has(tpl)) {
      validateDerivationLatex(derivLatex);
      seenLatexTemplates.add(tpl);
      return;
    }
    assert.ok(typeof derivLatex === "string" && derivLatex.length > 0, "Derivation LaTeX must be non-empty");
    assert.ok(derivLatex.includes("\\boxed{"), "Derivation step missing boxed answer");
    assert.ok(derivLatex.includes("="), "Derivation step missing equality");
    assert.ok(!derivLatex.includes("\\cdot^"), `\\cdot cannot take a direct superscript in step: ${derivLatex}`);
    assert.ok(!derivLatex.includes("\\cancel{}") && !derivLatex.includes("\\cancel{ }"), `Empty cancel bracket in step: ${derivLatex}`);
    assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{\\cfrac{"), `Illegal nested fraction tower (exceeds 2 levels) in step: ${derivLatex}`);
  };

  const failures = [];
  let cases = 0;

  // Layer 1: Pairwise step-level covering matrix
  for (const topic of topics) {
    for (const sys of ["SI", "US"]) {
      let firstSeedState = null;
      for (const seed of SEEDS) {
        let S;
        try { S = withSeededRandom(seed, () => topic.createSystem({ sys })); }
        catch (e) { failures.push({ layer: "createSystem", where: `${topic.id}[${sys}]`, msg: e.message }); continue; }

        if (firstSeedState && sameSystemState(firstSeedState, S)) {
          continue;
        }
        if (!firstSeedState) firstSeedState = S;

        for (const step of collectSteps(topic, sys, S)) {
          const rng = mulberry32(seed * 7919 + step.targetVar.length);
          const tokens = [...new Set([...step.nodes, step.targetVar])].filter(k => topic.varsDb[k]);
          const levels = tokens.map(k => unitLevels(S._u?.[k] || topic.varsDb[k].unit, topic.varsDb[k], rng, S[k]));
          const rows = coveringRows(levels.map(l => l.length), rng);

          const tIdx = tokens.indexOf(step.targetVar);
          rows.push(tokens.map((k, i) => {
            const j = levels[i].indexOf(levels[tIdx][0]);
            return j >= 0 ? j : 0;
          }));

          for (const row of rows) {
            cases++;
            const unitsByTok = Object.fromEntries(tokens.map((k, i) => [k, levels[i][row[i]]]));
            const where = `${topic.id}[${sys}] ${step.id} -> ${step.targetVar} {${tokens.map(k => `${k}:${unitsByTok[k]}`).join(", ")}} seed=${seed}`;
            const S2 = restate(S, tokens, unitsByTok, topic.varsDb, sys);
            const cur = { ...step, expectedVal: S2[step.targetVar] };
            const tUnit = S2._u?.[step.targetVar] || topic.varsDb[step.targetVar].unit;
            const changed = tokens.filter(k => unitsByTok[k] !== (S._u?.[k] || topic.varsDb[k].unit)).length;

            const res = checkStep({
              step: cur,
              S: S2,
              varsDb: topic.varsDb,
              relations: topic.relations,
              where,
              topicTag: `${topic.id}[${sys}]`,
              tags: tagsOf(step, tUnit, topic.varsDb),
              changed,
              validateLatexFn: validateLatexFast
            });
            failures.push(...res.failures);
          }
        }
      }
    }
  }

  // Layer 2: Seeded problem-generator matrix (SI, US, MIXED across low/mid/high mastery)
  for (const topic of topics) {
    for (const mode of ["SI", "US", "MIXED"]) {
      for (const seed of GEN_SEEDS) {
        const mastery = seed % 3 === 0 ? 0 : (seed % 3 === 1 ? 0.5 : 0.9);
        const genWhere = `${topic.id}[gen:${mode}] seed=${seed}`;
        let problem;
        try {
          problem = withSeededRandom(seed, () => generateProblem(topic, () => mastery, { mode }));
        } catch (e) {
          failures.push({ layer: "generateProblem", where: genWhere, topic: `${topic.id}[${mode}]`, msg: e.message });
          continue;
        }
        if (!problem) {
          failures.push({ layer: "generateProblem", where: genWhere, topic: `${topic.id}[${mode}]`, msg: "returned null" });
          continue;
        }

        try {
          validateStatementLatex(problem.statement, genWhere);
        } catch (e) {
          failures.push({ layer: "statement-latex", where: genWhere, topic: `${topic.id}[${mode}]`, msg: e.message });
        }

        for (const gVar of problem.givens) {
          const val = problem.system[gVar];
          const meta = problem.varsDb[gVar] || {};
          const u = problem.system._u?.[gVar] || meta.unit;
          if (typeof val !== "number" || isNaN(val) || !u) {
            failures.push({ layer: "given-invalid", where: `${genWhere} given=${gVar}`, topic: `${topic.id}[${mode}]`, msg: `val=${val}, unit=${u}` });
            continue;
          }
          const baseVal = valueToCoherentBase(val, u, meta.dimension);
          if (!Number.isFinite(baseVal)) {
            failures.push({ layer: "given-nonfinite", where: `${genWhere} given=${gVar}`, topic: `${topic.id}[${mode}]`, msg: `baseVal=${baseVal}` });
          }
        }

        for (const step of problem.solution) {
          cases++;
          const meta = problem.varsDb[step.targetVar] || {};
          const tUnit = problem.system._u?.[step.targetVar] || meta.unit || "";
          const where = `${topic.id}[gen:${mode}] ${step.id || step.eqId} -> ${step.targetVar} seed=${seed}`;

          if (!step.isFaded) {
            if (typeof step.expectedVal !== "number" || !Number.isFinite(step.expectedVal)) {
              failures.push({ layer: "step-nonfinite", where, topic: `${topic.id}[${mode}]`, msg: `expectedVal=${step.expectedVal}` });
              continue;
            }
            const baseVal = valueToCoherentBase(step.expectedVal, tUnit, meta.dimension);
            const projected = formatValueInUnit(baseVal, tUnit, meta.dimension);
            const relErr = Math.abs(projected - step.expectedVal) / (Math.abs(step.expectedVal) || 1);
            if (!Number.isFinite(baseVal) || !(relErr < 1e-3)) {
              failures.push({ layer: "step-roundtrip", where, topic: `${topic.id}[${mode}]`, msg: `expected ${step.expectedVal}, projected ${projected}` });
            }
          }

          const res = checkStep({
            step,
            S: problem.system,
            varsDb: problem.varsDb,
            relations: topic.relations,
            allSteps: problem.allSteps,
            where,
            topicTag: `${topic.id}[gen:${mode}]`,
            tags: tagsOf(step, tUnit, problem.varsDb),
            changed: 0,
            validateLatexFn: validateLatexFast
          });
          failures.push(...res.failures);
        }
      }
    }
  }

  return { failures, cases, skipped: levelStats.skipped };
}

if (parentPort && workerData) {
  runMatrixForTopicIds(workerData.topicIds)
    .then(res => parentPort.postMessage(res))
    .catch(err => { throw err; });
}
