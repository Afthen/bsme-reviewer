/**
 * src/core/problem_gen.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Formula-as-Node Graph Problem Generator
 * ============================================================================
 * PHILOSOPHY:
 * 1. Cognitive Scaffolding:
 *    Problem complexity (hop distance) dynamically scales based on decayed mastery:
 *      - Mastery < 38.2% (phi^-2): Single direct formula (0 hops)
 *      - 38.2% to 61.8% (phi^-1): Two formulas with 1 bridge variable (1 hop)
 *      - Mastery >= 61.8%: Multi-step synthesis chain (2-3 hops)
 *
 * 2. Board-Exam Distractor Variable Injection:
 *    With a 30% probability, realistic distractor variables from S that are NOT
 *    needed in the solution path are included in the given specifications to
 *    test whether the student can identify the correct relations.
 *
 * 3. 6-Significant-Figure Universal Precision:
 *    Values in problem statements and answers are formatted using fmtSigFig to
 *    prevent floating-point roundoff artifacts.
 * ============================================================================
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { PHI_INV, PHI_INV2 } from "../repetition/mastery.js";
import { fmtSigFig } from "./dimensions.js";

/**
 * Determines problem graph distance (scaffolding level) from mastery score.
 */
function determineGraphDistance(mastery) {
  if (mastery < PHI_INV2) return 0; // < 38.2% -> single direct formula
  if (mastery < PHI_INV)  return 1; // 38.2% to 61.8% -> 2 formulas, 1 bridge
  return Math.random() < 0.5 ? 2 : 3; // >= 61.8% -> synthesis chain
}

/**
 * Traverses the relation graph to build a solvable problem path.
 */
export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  const scoredNodes = relations.map(node => {
    const mastery = getMastery(node.id);
    const weight = mastery === 0 ? 5.0 : Math.max(0.02, Math.pow(1 - mastery, 3));
    const key = Math.pow(Math.random(), 1 / weight);
    return { node, weight, key, mastery };
  });

  scoredNodes.sort((a, b) => b.key - a.key);

  for (const { node: targetNode, mastery } of scoredNodes) {
    const candidateGoals = [...targetNode.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      if (targetNode.solvable && !targetNode.solvable.includes(goalVar)) {
        continue;
      }
      const problem = buildGraphPath(targetNode, goalVar, relations, S, mastery, getMastery);
      if (problem) return problem;
    }
  }

  const fallback = scoredNodes[0].node;
  const goalVar = fallback.solvable ? fallback.solvable[0] : fallback.nodes[0];
  const givens = fallback.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [], targetEqId: fallback.id, hopDistance: 0 };
}

function buildGraphPath(targetNode, goalVar, relations, S, targetMastery, getMastery) {
  let givens = targetNode.nodes.filter(n => n !== goalVar);
  const desiredHops = determineGraphDistance(targetMastery);

  let hops = 0;
  let attempts = 0;

  while (hops < desiredHops && attempts < 15) {
    attempts++;

    const bridgeableEdges = givens.filter(edgeVar =>
      relations.some(r => r.id !== targetNode.id && r.nodes.includes(edgeVar))
    );
    if (bridgeableEdges.length === 0) break;

    const chosenEdge = bridgeableEdges[Math.floor(Math.random() * bridgeableEdges.length)];
    const neighborNodes = relations.filter(r => r.id !== targetNode.id && r.nodes.includes(chosenEdge));
    const neighbor = neighborNodes[Math.floor(Math.random() * neighborNodes.length)];
    const neighborGivens = neighbor.nodes.filter(n => n !== chosenEdge);

    if (!neighborGivens.includes(goalVar) && !neighborGivens.includes(chosenEdge)) {
      const candidateSet = Array.from(new Set([
        ...givens.filter(g => g !== chosenEdge),
        ...neighborGivens
      ]));

      if (candidateSet.length <= 6 && canSolveTarget(candidateSet, goalVar, relations, getMastery)) {
        givens = candidateSet;
        hops++;
      }
    }
  }

  const steps = solveDAG(givens, S, relations, {}, getMastery);
  const required = pruneSolutionPath(steps, goalVar);

  const usesTarget = required.some(s => s.eqId === targetNode.id || s.systemEqIds?.includes(targetNode.id));
  if (!usesTarget) return null;

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
    targetEqId: targetNode.id,
    hopDistance: hops
  };
}

/**
 * Builds the natural language problem statement narrative.
 */
export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}, topicConfig = {}) {
  if (typeof topicConfig.statementBuilder === "function") {
    return topicConfig.statementBuilder(givens, visibleGoals, S, varsDb);
  }

  const parts = givens.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    const meta = varsDb[v] || {};
    const sym = meta.symbol || v;
    const name = meta.name || v;

    const formattedVal = fmtSigFig(val, 6);
    let valWithUnit = `$${formattedVal}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      valWithUnit = (u === "deg" || u === "°") ? `$${formattedVal}°$` : `$${formattedVal}\\text{ ${u}}$`;
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
      uStr = (u === "deg" || u === "°") ? " in °" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${sym}$</span>)</span>${uStr}`;
  });

  const systemNoun = topicConfig.noun || `${topicConfig.title || "Mechanical"} system`;
  return `A ${systemNoun} operates with the following specifications: ${parts.join(", ")}. Determine: ${goalStrings.join(", and ")}.`;
}

/**
 * Top-Level Universal Problem Orchestrator.
 * Connects the topic schema, ground-truth generator, graph solver, and narrative builder.
 */
export function generateProblem(topic, getMastery = () => 0) {
  const { title, varsDb, relations, createSystem } = topic;
  const S = createSystem();

  // 1. Walk graph to determine given variables and target goal
  const path = generateAutonomousProblem(relations, S, varsDb, getMastery);

  // 2. Solve DAG and prune solution steps to the target goal
  const allSteps = solveDAG(path.givens, S, relations, varsDb, getMastery);
  const solution = pruneSolutionPath(allSteps, path.goalVar);

  // 3. Build problem statement narrative
  const visibleGoals = [path.goalVar];
  const statement = buildProblemStatement(path.givens, visibleGoals, S, varsDb, topic);

  return {
    title: `${title} Design Problem`,
    statement,
    solution,
    solutionSteps: solution, // Alias for step submit handlers
    allSteps,
    givens: path.givens,
    distractors: path.distractors,
    system: S,
    varsDb,
    topicId: topic.id
  };
}
