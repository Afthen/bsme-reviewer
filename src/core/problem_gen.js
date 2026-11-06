/**
 * src/core/problem_gen.js
 * Autonomous graph-walk problem generator with true priority-weighted sampling
 * and natural multi-step depth distribution.
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";

// ========================================================
// 1. EQUATION-TARGETED AUTONOMOUS PROBLEM GENERATION
// ========================================================

/**
 * Generates an organic problem prioritizing unmastered equations (0% mastery).
 * @param {Array} relations - Topic relation graph.
 * @param {Object} S - Ground truth system state.
 * @param {Object} varsDb - Topic variable metadata.
 * @param {Function} getMastery - (eqId) => score in [0, 1].
 */
export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  // 1. Weight equations by unmastered deficiency (0% mastery = weight 1.0, 100% = 0.03)
  const scoredRelations = relations.map(eq => {
    const mastery = getMastery(eq.id);
    const weight = Math.max(0.03, Math.pow(1 - mastery, 2));
    // A-Res Weighted Key: larger weight => larger key
    const key = Math.pow(Math.random(), 1 / weight);
    return { eq, weight, key };
  });

  // Sort DESCENDING (largest key first): 0% mastery equations will be at the front
  scoredRelations.sort((a, b) => b.key - a.key);

  for (const { eq: targetEq } of scoredRelations) {
    // Pick an unknown goal node from the target relation
    const candidateGoals = [...targetEq.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      const problem = buildAdaptivePath(targetEq, goalVar, relations, S);
      if (problem) return problem;
    }
  }

  // Fallback to random relation
  const fallbackEq = relations[Math.floor(Math.random() * relations.length)];
  const goalVar = fallbackEq.nodes[0];
  const givens = fallbackEq.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [] };
}

/**
 * Chains backwards through the DAG to build rich 1-step, 2-step, or 3-step problems.
 */
function buildAdaptivePath(targetEq, goalVar, relations, S) {
  let givens = targetEq.nodes.filter(n => n !== goalVar);

  // Natural depth distribution:
  // 20% 1-step (direct), 45% 2-step (synthesis), 35% 3-to-4 step (design chain)
  const depthRoll = Math.random();
  const desiredHops = depthRoll < 0.20 ? 0 : (depthRoll < 0.65 ? 1 : Math.floor(Math.random() * 2) + 2);

  let hops = 0;
  let attempts = 0;

  // Backward expansion loop
  while (hops < desiredHops && attempts < 15) {
    attempts++;

    // Find all current givens that can be produced by another relation
    const expandableGivens = givens.filter(g =>
      relations.some(r => r.id !== targetEq.id && r.nodes.includes(g))
    );
    if (expandableGivens.length === 0) break;

    const expandVar = expandableGivens[Math.floor(Math.random() * expandableGivens.length)];
    const producerEqs = relations.filter(r => r.id !== targetEq.id && r.nodes.includes(expandVar));
    const chosenProducer = producerEqs[Math.floor(Math.random() * producerEqs.length)];
    const subGivens = chosenProducer.nodes.filter(n => n !== expandVar);

    // Prevent circular references to the goal
    if (!subGivens.includes(goalVar) && !subGivens.includes(expandVar)) {
      const candidateSet = Array.from(new Set([
        ...givens.filter(g => g !== expandVar),
        ...subGivens
      ]));

      // Allow up to 6 givens for realistic engineering problems
      if (candidateSet.length <= 6 && canSolveTarget(candidateSet, goalVar, relations)) {
        givens = candidateSet;
        hops++;
      }
    }
  }

  // Ensure path solvability on the ground truth system
  if (!canSolveTarget(givens, goalVar, relations)) return null;

  // Add Optional Distractor Parameter (40% chance)
  const steps = solveDAG(givens, S, relations);
  const required = pruneSolutionPath(steps, goalVar);
  const usedVars = new Set(required.flatMap(s => s.nodes || [s.targetVar]));
  givens.forEach(g => usedVars.add(g));

  const candidateDistractors = Object.keys(S).filter(k => 
    !k.startsWith("_") && !usedVars.has(k) && typeof S[k] === "number" && !isNaN(S[k])
  );

  const distractors = candidateDistractors.length > 0 && Math.random() < 0.40
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
    if (u && u !== "dimless" && u !== "ratio" && u !== "teeth") {
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
    if (u && u !== "dimless" && u !== "ratio" && u !== "teeth") {
      uStr = u === "deg" ? " in °" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${sym}$</span>)</span>${uStr}`;
  });

  return `A spur gear drive operates with the following specifications: ${parts.join(", ")}. Determine: ${goalStrings.join(", and ")}.`;
}
