/**
 * src/core/problem_gen.js
 * Dual-constrained adaptive problem generator (Mastery-Scaled Difficulty + Budget-Bounded DAG Depth).
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { PHI_INV2, FADING_THRESHOLD } from "../repetition/mastery.js";

// ========================================================
// 1. DUAL-CONSTRAINED AUTONOMOUS PROBLEM GENERATION
// ========================================================

/**
 * Generates an organic problem with depth and breadth governed simultaneously
 * by user mastery and given budget constraints.
 * @param {Array} relations - Topic relation graph.
 * @param {Object} S - Ground truth system state.
 * @param {Object} varsDb - Topic variable metadata.
 * @param {Function} getMastery - (eqId) => score in [0, 1].
 */
export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  // 1. Calculate Aggregate Global Mastery
  const allEqIds = relations.map(r => r.id);
  const totalMastery = allEqIds.reduce((sum, id) => sum + getMastery(id), 0);
  const avgMastery = allEqIds.length > 0 ? totalMastery / allEqIds.length : 0;

  // 2. Score Relations Prioritizing Unmastered Equations (0% mastery = highest priority)
  const scoredRelations = relations.map(eq => {
    const mastery = getMastery(eq.id);
    const weight = Math.max(0.05, Math.pow(1 - mastery, 1.618));
    return { eq, weight };
  });

  // Roulette wheel selection based on lowest mastery
  scoredRelations.sort((a, b) => Math.pow(Math.random(), 1 / a.weight) - Math.pow(Math.random(), 1 / b.weight));

  for (const { eq: targetEq } of scoredRelations) {
    // Pick an unknown goal node from the target relation
    const candidateGoals = [...targetEq.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      const problem = buildAdaptivePath(targetEq, goalVar, relations, S, avgMastery);
      if (problem) return problem;
    }
  }

  // Fallback to random 1-step relation
  const fallbackEq = relations[Math.floor(Math.random() * relations.length)];
  const goalVar = fallbackEq.nodes[0];
  const givens = fallbackEq.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [] };
}

/**
 * Chains backwards through the DAG constrained simultaneously by
 * maximum hop depth and target given budget.
 */
function buildAdaptivePath(targetEq, goalVar, relations, S, avgMastery) {
  let givens = targetEq.nodes.filter(n => n !== goalVar);

  // 1. Set Difficulty Profile based on Golden Ratio mastery milestones
  let maxHops;
  let minGivens;
  let maxGivens;
  let distractorProb;

  if (avgMastery < PHI_INV2) {
    // Tier 1 (Beginner < 38.2%): 1 to 2 hops, 2 to 3 givens
    maxHops = Math.random() < 0.6 ? 1 : 2;
    minGivens = 2;
    maxGivens = 3;
    distractorProb = 0.15;
  } else if (avgMastery < FADING_THRESHOLD) {
    // Tier 2 (Intermediate 38.2% - 76.4%): 2 to 3 hops, 3 to 5 givens
    maxHops = Math.floor(Math.random() * 2) + 2; // 2 or 3 hops
    minGivens = 3;
    maxGivens = 5;
    distractorProb = 0.35;
  } else {
    // Tier 3 (Advanced / Exam-Ready >= 76.4%): 3 to 5 hops, 4 to 6 givens
    maxHops = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 hops
    minGivens = 4;
    maxGivens = 6;
    distractorProb = 0.45;
  }

  // Pick specific target given budget for this problem instance
  const targetBudget = Math.floor(Math.random() * (maxGivens - minGivens + 1)) + minGivens;

  let hops = 0;
  let attempts = 0;

  // 2. Dual-Constrained Backward DAG Walk (bounded by both hops and budget)
  while (hops < maxHops && givens.length < targetBudget && attempts < 15) {
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
    if (!subGivens.includes(goalVar)) {
      const candidateSet = Array.from(new Set([
        ...givens.filter(g => g !== expandVar),
        ...subGivens
      ]));

      // Check budget ceiling and solvability
      if (candidateSet.length <= maxGivens + 1 && canSolveTarget(candidateSet, goalVar, relations)) {
        givens = candidateSet;
        hops++;
      }
    }
  }

  // Ensure path solvability on the ground truth system
  if (!canSolveTarget(givens, goalVar, relations)) return null;

  // 3. Add Optional Distractor Parameter (scaled by mastery tier)
  const steps = solveDAG(givens, S, relations);
  const required = pruneSolutionPath(steps, goalVar);
  const usedVars = new Set(required.flatMap(s => s.nodes || [s.targetVar]));
  givens.forEach(g => usedVars.add(g));

  const candidateDistractors = Object.keys(S).filter(k => 
    !k.startsWith("_") && !usedVars.has(k) && typeof S[k] === "number" && !isNaN(S[k])
  );

  const distractors = candidateDistractors.length > 0 && Math.random() < distractorProb
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
