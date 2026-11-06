/**
 * src/core/problem_gen.js
 * Autonomous graph-walk problem generator and dynamic statement formatter.
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";

// ========================================================
// 1. ORGANIC GRAPH-WALK PROBLEM SYNTHESIS
// ========================================================

/**
 * Autonomously discovers a valid, non-redundant (givens -> goal) problem directly from the DAG.
 * @param {Array} relations - Topic relation graph.
 * @param {Object} S - Ground truth system state.
 * @param {Object} varsDb - Topic variable metadata.
 * @param {Function} getMastery - (eqId) => score in [0, 1].
 */
export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  const allVars = Array.from(new Set(relations.flatMap(r => r.nodes)));
  
  // Weight target variables by lowest mastery of relations that can determine them
  const scoredTargets = allVars.map(v => {
    const solvingEqs = relations.filter(r => r.nodes.includes(v));
    if (solvingEqs.length === 0) return { v, weight: 0 };
    const avgMastery = solvingEqs.reduce((sum, eq) => sum + getMastery(eq.id), 0) / solvingEqs.length;
    return { v, weight: Math.max(0.05, 1 - avgMastery) };
  }).filter(t => t.weight > 0);

  scoredTargets.sort((a, b) => Math.pow(Math.random(), 1 / a.weight) - Math.pow(Math.random(), 1 / b.weight));

  // Try top candidate targets
  for (const { v: goalVar } of scoredTargets) {
    const candidate = synthesizePathForGoal(goalVar, relations, S, 3);
    if (candidate) return candidate;
  }

  // Fallback to arbitrary 1-step relation
  const fallbackEq = relations[Math.floor(Math.random() * relations.length)];
  const goalVar = fallbackEq.nodes[0];
  const givens = fallbackEq.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [] };
}

/**
 * Backward graph walk to find a minimal given set for a target variable.
 */
function synthesizePathForGoal(goalVar, relations, S, maxDepth = 3) {
  const solversOf = v => relations.filter(r => r.nodes.includes(v));

  function expand(v, depth, bannedEqs) {
    const candidates = solversOf(v).filter(e => !bannedEqs.has(e.id));
    if (depth <= 0 || candidates.length === 0 || Math.random() < 0.382) {
      return [v];
    }
    const chosenEq = candidates[Math.floor(Math.random() * candidates.length)];
    const nextBanned = new Set([...bannedEqs, chosenEq.id]);
    return chosenEq.nodes.filter(n => n !== v).flatMap(n => expand(n, depth - 1, nextBanned));
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const rawGivens = Array.from(new Set(expand(goalVar, maxDepth, new Set())));
    if (rawGivens.includes(goalVar) || rawGivens.length < 1 || rawGivens.length > 5) continue;

    // Verify solvability
    if (!canSolveTarget(rawGivens, goalVar, relations)) continue;

    // Minimize: strip any given that isn't strictly necessary
    const minimalGivens = rawGivens.filter(g => {
      const reduced = rawGivens.filter(x => x !== g);
      return !canSolveTarget(reduced, goalVar, relations);
    });

    if (minimalGivens.length === 0 || !canSolveTarget(minimalGivens, goalVar, relations)) continue;

    // Select optional distractor variable (present in system but unused in solution)
    const steps = solveDAG(minimalGivens, S, relations);
    const requiredSteps = pruneSolutionPath(steps, goalVar);
    const usedVars = new Set(requiredSteps.flatMap(s => s.nodes || [s.targetVar]));
    minimalGivens.forEach(g => usedVars.add(g));

    const candidateDistractors = Object.keys(S).filter(k => 
      !k.startsWith("_") && !usedVars.has(k) && S[k] !== undefined && typeof S[k] === "number"
    );

    const distractors = candidateDistractors.length > 0 && Math.random() < 0.45
      ? [candidateDistractors[Math.floor(Math.random() * candidateDistractors.length)]]
      : [];

    return {
      goalVar,
      givens: [...minimalGivens, ...distractors].sort(),
      distractors,
      requiredSteps
    };
  }

  return null;
}

// ========================================================
// 2. DYNAMIC STATEMENT FORMATTER
// ========================================================

/**
 * Builds the natural-language problem statement.
 * Synchronizes visible goals with scaffolding state (faded intermediate steps are omitted).
 */
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
