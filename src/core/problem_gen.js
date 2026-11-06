/**
 * src/core/problem_gen.js
 * Autonomous graph-walk problem generator with strict target enforcement
 * and true deficiency-weighted selection.
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";

// ========================================================
// 1. EQUATION-TARGETED PROBLEM GENERATION
// ========================================================

/**
 * Generates an organic problem strictly guaranteeing that under-mastered
 * equations appear in the solution path.
 */
export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  // 1. Weight equations by deficiency: 0% mastery = maximum priority
  const scoredRelations = relations.map(eq => {
    const mastery = getMastery(eq.id);
    // Unattempted (0%) gets massive priority boost; mastered (>=0.8) drops exponentially
    const weight = mastery === 0 ? 5.0 : Math.max(0.02, Math.pow(1 - mastery, 3));
    // A-Res Weighted Key: larger weight => higher rank
    const key = Math.pow(Math.random(), 1 / weight);
    return { eq, weight, key, mastery };
  });

  // Sort descending: unmastered equations are evaluated first
  scoredRelations.sort((a, b) => b.key - a.key);

  for (const { eq: targetEq } of scoredRelations) {
    const candidateGoals = [...targetEq.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      const problem = buildAdaptivePath(targetEq, goalVar, relations, S, getMastery);
      if (problem) return problem;
    }
  }

  // Fallback: direct 1-step problem on the lowest mastery relation
  const fallbackEq = scoredRelations[0].eq;
  const goalVar = fallbackEq.nodes[0];
  const givens = fallbackEq.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [], targetEqId: fallbackEq.id };
}

/**
 * Chains backwards through the DAG and enforces that targetEq is strictly
 * included in the student's solution steps.
 */
function buildAdaptivePath(targetEq, goalVar, relations, S, getMastery) {
  let givens = targetEq.nodes.filter(n => n !== goalVar);

  // Depth: 30% 1-step (direct practice on weak eq), 50% 2-step, 20% 3-step
  const depthRoll = Math.random();
  const desiredHops = depthRoll < 0.30 ? 0 : (depthRoll < 0.80 ? 1 : 2);

  let hops = 0;
  let attempts = 0;

  while (hops < desiredHops && attempts < 15) {
    attempts++;

    const expandableGivens = givens.filter(g =>
      relations.some(r => r.id !== targetEq.id && r.nodes.includes(g))
    );
    if (expandableGivens.length === 0) break;

    const expandVar = expandableGivens[Math.floor(Math.random() * expandableGivens.length)];
    const producerEqs = relations.filter(r => r.id !== targetEq.id && r.nodes.includes(expandVar));
    const chosenProducer = producerEqs[Math.floor(Math.random() * producerEqs.length)];
    const subGivens = chosenProducer.nodes.filter(n => n !== expandVar);

    if (!subGivens.includes(goalVar) && !subGivens.includes(expandVar)) {
      const candidateSet = Array.from(new Set([
        ...givens.filter(g => g !== expandVar),
        ...subGivens
      ]));

      if (candidateSet.length <= 6 && canSolveTarget(candidateSet, goalVar, relations, getMastery)) {
        givens = candidateSet;
        hops++;
      }
    }
  }

  // Solve forward using mastery-prioritized solver
  const steps = solveDAG(givens, S, relations, {}, getMastery);
  const required = pruneSolutionPath(steps, goalVar);

  // STRICT CHECK: The generated problem MUST require targetEq in its solution steps!
  // If targetEq was bypassed or shortcutted by other equations, reject this path.
  const containsTarget = required.some(s => s.eqId === targetEq.id);
  if (!containsTarget) return null;

  // Add optional distractor (30% chance)
  const usedVars = new Set(required.flatMap(s => s.nodes || [s.targetVar]));
  givens.forEach(g => usedVars.add(g));

  const candidateDistractors = Object.keys(S).filter(k =>
    !k.startsWith("_") && !usedVars.has(k) && typeof S[k] === "number" && !isNaN(S[k])
  );

  const distractors = candidateDistractors.length > 0 && Math.random() < 0.30
    ? [candidateDistractors[Math.floor(Math.random() * candidateDistractors.length)]]
    : [];

  return {
    goalVar,
    givens: Array.from(new Set([...givens, ...distractors])).sort(),
    distractors,
    targetEqId: targetEq.id,
    hopDepth: hops + 1
  };
}

// ========================================================
// 2. DYNAMIC STATEMENT FORMATTER
// ========================================================

export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}) {
  const parts = givens.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    const meta = varsDb[v] || {};
    const sym = meta.symbol || v;
    const name = meta.name || v;

    let valWithUnit = `$${val}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      valWithUnit = u === "deg" ? `$${val}^\\circ$` : `$${val}\\text{ ${u}}$`;
    }

    return `${name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${sym}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const meta = varsDb[gVar] || {};
    const sym = meta.symbol || gVar;
    const name = meta.name || gVar;
    const u = S._u?.[gVar] || meta.unit || "";

    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") {
      uStr = u === "deg" ? " in °" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${sym}$</span>)</span>${uStr}`;
  });

  return `A spur gear drive operates with the following specifications: ${parts.join(", ")}. Determine: ${goalStrings.join(", and ")}.`;
}
