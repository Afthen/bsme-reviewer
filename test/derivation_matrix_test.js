/**
 * test/derivation_matrix_test.js
 * Deterministic derivation matrix across two layers:
 * 1. Pairwise step matrix: every topic x system x relation x solvable target under
 *    2-wise unit coverage.
 * 2. Seeded problem-generator matrix: every topic x mode (SI/US/MIXED) x seed x mastery,
 *    checking statement LaTeX, finite/coherent givens & active steps, coupled-group
 *    coherence, derivation LaTeX, numerical oracle match, and canonical scale factors.
 * All failures are collected and reported grouped by layer; nothing stops at the first one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAllTopics } from "../src/topics/index.js";
import { parseMathAST } from "../src/cas/ast.js";
import { generateProblem } from "../src/core/problem_gen.js";
import { valueToCoherentBase, formatValueInUnit } from "../src/cas/units/index.js";
import { validateStatementLatex } from "./latex_oracle.js";
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

test("Derivation matrix: pairwise step coverage and seeded problem-generator invariants", async () => {
  const loaded = await loadAllTopics();
  const topics = Array.isArray(loaded) ? loaded : Object.values(loaded);
  const failures = [];
  let cases = 0;

  // Layer 1: Pairwise step-level covering matrix
  for (const topic of topics) {
    for (const sys of ["SI", "US"]) {
      for (const seed of SEEDS) {
        let S;
        try { S = withSeededRandom(seed, () => topic.createSystem({ sys })); }
        catch (e) { failures.push({ layer: "createSystem", where: `${topic.id}[${sys}]`, msg: e.message }); continue; }

        for (const step of collectSteps(topic, sys, S)) {
          const rng = mulberry32(seed * 7919 + step.targetVar.length);
          const tokens = [...new Set([...step.nodes, step.targetVar])].filter(k => topic.varsDb[k]);
          const levels = tokens.map(k => unitLevels(S._u?.[k] || topic.varsDb[k].unit, topic.varsDb[k], rng, S[k]));
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
              changed
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
            changed: 0
          });
          failures.push(...res.failures);
        }
      }
    }
  }

  if (levelStats.skipped > 0) console.log(`[matrix] skipped ${levelStats.skipped} unit levels below the display floor`);
  if (failures.length > 0) {
    const groups = new Map();
    for (const f of failures) {
      const k = `${f.layer} | ${f.where.split(" {")[0]}`;
      if (!groups.has(k)) groups.set(k, { n: 0, example: f });
      groups.get(k).n++;
    }
    const byLayer = {};
    for (const f of failures) byLayer[f.layer] = (byLayer[f.layer] || 0) + 1;
    console.log(`\n[matrix] ${cases} cases, ${failures.length} failures`);
    console.log("[matrix] failures by layer:", byLayer);
    const count = (keyFn) => {
      const m = new Map();
      for (const f of failures) for (const k of [].concat(keyFn(f) ?? [])) m.set(k, (m.get(k) || 0) + 1);
      return [...m].sort((a, b) => b[1] - a[1]);
    };
    console.log("[matrix] by topic:", count(f => f.topic));
    console.log("[matrix] by tag:", count(f => f.tags));

    console.log("[matrix] failures with all tokens in canonical units:", failures.filter(f => f.changed === 0).length);
    const minimal = new Map();
    for (const f of failures) {
      if (f.layer !== "derivation-numeric") continue;
      const k = f.where.split(" {")[0];
      if (!minimal.has(k) || f.changed < minimal.get(k).changed) minimal.set(k, f);
    }
    const mins = [...minimal.values()].sort((a, b) => a.changed - b.changed);
    console.log(`[matrix] distinct failing (relation,target): ${mins.length}`);
    for (const f of mins.slice(0, 10)) {
      console.log(`[matrix] MIN changed=${f.changed} ${f.where} | ROW: ${(f.row || "").slice(0, 160)}`);
    }
    for (const [k, g] of groups) {
      const ex = g.example.where;
      const brace = ex.indexOf(" {");
      console.log(`  ${k} x${g.n} | ${brace >= 0 ? ex.slice(brace + 1) : ""} | ${g.example.msg.split(" (")[0]}`);
    }
  }

  assert.equal(failures.length, 0, `${failures.length} matrix failures (see summary above)`);
});
