/**
 * src/core/problem_gen.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Formula-as-Node Graph Problem Generator
 * ============================================================================
 * PHILOSOPHY:
 * 1. Cognitive Scaffolding:
 *    Problem hop distance scales dynamically based on Golden Ratio breakpoints:
 *      - Mastery < 38.2% (Phi^-2): Single direct formula (0 hops)
 *      - 38.2% to 61.8% (Phi^-1): Two formulas with 1 bridge variable (1 hop)
 *      - 61.8% to 76.4% (Fading): Multi-step synthesis chain (2 hops)
 *      - Mastery >= 76.4%: Deep graph walking (Fib_3 hops)
 * 2. Board-Exam Distractor Injection:
 *    Injects variables not needed in the solution path based on Phi^-3 (~23.6%).
 * 3. The "Textbook Curation" Principle (Neat Givens):
 *    Rounds givens to clean numbers using fmtSigFig, then re-evaluates the
 *    downstream AST path so student answers match calculated values perfectly.
 * ============================================================================
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { parseMathAST } from "../cas/ast.js";
import { evaluatePhysicalAST } from "../cas/units/index.js";
import { 
  PHI_INV, PHI_INV2, PHI_INV3, PHI_INV6, PHI_INV7, FADING_THRESHOLD, 
  FIB_3, FIB_8, FIB_13 
} from "../repetition/mastery.js";
import { fmtSigFig } from "./dimensions.js";

function determineGraphDistance(mastery) {
  if (mastery < PHI_INV2) return 0;           // < 38.2%
  if (mastery < PHI_INV) return 1;            // < 61.8%
  if (mastery < FADING_THRESHOLD) return 2;   // < 76.4%
  return FIB_3;                               // >= 76.4%
}

export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  const scoredNodes = relations.map(node => {
    const mastery = getMastery(node);
    const weight = Math.max(PHI_INV7, Math.pow((1 + PHI_INV6) - mastery, FIB_3));
    const key = weight * (PHI_INV + PHI_INV2 * Math.random());
    return { node, weight, key, mastery };
  });

  scoredNodes.sort((a, b) => b.key - a.key);

  for (const { node: targetNode, mastery } of scoredNodes) {
    const candidateGoals = [...targetNode.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      if (targetNode.solvable && !targetNode.solvable.includes(goalVar)) {
        continue;
      }
      const problem = buildGraphPath(targetNode, goalVar, relations, S, mastery);
      if (problem) return problem;
    }
  }

  const fallback = scoredNodes[0].node;
  const goalVar = fallback.solvable ? fallback.solvable[0] : fallback.nodes[0];
  const givens = fallback.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [], targetEqId: fallback.id, hopDistance: 0 };
}

function buildGraphPath(targetNode, goalVar, relations, S, targetMastery) {
  let currentGivens = targetNode.nodes.filter(n => n !== goalVar);
  const desiredHops = determineGraphDistance(targetMastery);

  let bestPath = { givens: currentGivens, hops: 0 };

  for (let h = 0; h < desiredHops; h++) {
    let expansions = [];
    
    for (const g of currentGivens) {
      const neighborRels = relations.filter(r => r.id !== targetNode.id && r.nodes.includes(g));
      
      for (const nRel of neighborRels) {
        const newInputs = nRel.nodes.filter(n => n !== g);
        
        if (!newInputs.includes(goalVar)) {
          const candidateSet = Array.from(new Set([
            ...currentGivens.filter(x => x !== g),
            ...newInputs
          ]));

          if (candidateSet.length <= FIB_8 && canSolveTarget(candidateSet, goalVar, relations)) {
            expansions.push(candidateSet);
          }
        }
      }
    }

    if (expansions.length === 0) break;

    currentGivens = expansions[Math.floor(Math.random() * expansions.length)];
    bestPath = { givens: currentGivens, hops: h + 1 };
  }

  const steps = solveDAG(bestPath.givens, S, relations, {}, () => 0);
  const required = pruneSolutionPath(steps, goalVar);

  const usesTarget = required.some(s => s.eqId === targetNode.id || s.systemEqIds?.includes(targetNode.id));
  if (!usesTarget) return null;

  const usedVars = new Set(required.flatMap(s => s.nodes || [s.targetVar]));
  bestPath.givens.forEach(g => usedVars.add(g));

  const candidateDistractors = Object.keys(S).filter(k =>
    !k.startsWith("_") && !usedVars.has(k) && typeof S[k] === "number" && !isNaN(S[k])
  );

  const distractors = candidateDistractors.length > 0 && Math.random() < PHI_INV3
    ? [candidateDistractors[Math.floor(Math.random() * candidateDistractors.length)]]
    : [];

  return {
    goalVar,
    givens: Array.from(new Set([...bestPath.givens, ...distractors])).sort(),
    distractors,
    targetEqId: targetNode.id,
    hopDistance: bestPath.hops
  };
}

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
      valWithUnit = (u === "deg" || u === "°") ? `$${formattedVal}^\\circ$` : `$${formattedVal}\\text{ ${u}}$`;
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
      uStr = (u === "deg" || u === "°") ? " in ^\\circ" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${sym}$</span>)</span>${uStr}`;
  });

  const systemNoun = topicConfig.noun || `${topicConfig.title || "Mechanical"} system`;
  const goalsFormatted = goalStrings.length > 2 
    ? goalStrings.slice(0, -1).join(", ") + ", and " + goalStrings[goalStrings.length - 1]
    : goalStrings.join(" and ");

  return `A ${systemNoun} operates with the following specifications: ${parts.join(", ")}. Determine: ${goalsFormatted}.`;
}

export function generateProblem(topic, getMastery = () => 0) {
  const { title, varsDb, relations, createSystem } = topic;
  const S_raw = createSystem();

  const path = generateAutonomousProblem(relations, S_raw, varsDb, getMastery);

  const targetRel = relations.find(r => r.id === path.targetEqId);
  const problemTitle = targetRel ? targetRel.name : `${title} Design Problem`;

  // --- TEXTBOOK NEATNESS PASS ---
  const S_neat = { ...S_raw };
  path.givens.forEach(g => {
    const val = S_raw[g];
    if (typeof val !== "number") return;
    
    const meta = varsDb[g] || {};
    if (meta.isInteger) {
      S_neat[g] = Math.round(val);
    } else {
      const formattedStr = fmtSigFig(val, 6);
      S_neat[g] = parseFloat(formattedStr);
    }
  });

  const allSteps = solveDAG(path.givens, S_neat, relations, varsDb, () => 0);
  
  allSteps.forEach(step => {
    const ast = parseMathAST(step.rhsExpr);
    const { value } = evaluatePhysicalAST(ast, S_neat, step.targetVar, varsDb, step.requiredUnits);
    S_neat[step.targetVar] = value;
    step.expectedVal = value;
  });

  // Pass getMastery to pruneSolutionPath so cognitive fading activates!
  const solution = pruneSolutionPath(allSteps, path.goalVar, getMastery);

  // Apply Fading: Pre-fill mastered foundation steps so the student focuses on synthesis
  solution.forEach(step => {
    if (step.isFaded) {
      step.isAnswered = true;
      step.isRevealed = true;
      step.userVal = step.expectedVal;
    }
  });

  // Only the active, non-faded steps should appear in the "Determine: X, Y, and Z" prompt!
  const visibleGoals = solution.filter(s => !s.isFaded).map(s => s.targetVar);
  const statement = buildProblemStatement(path.givens, visibleGoals, S_neat, varsDb, topic);

  return {
    title: problemTitle,
    statement,
    solution,
    solutionSteps: solution,
    allSteps,
    givens: path.givens,
    distractors: path.distractors,
    system: S_neat,
    varsDb,
    topicId: topic.id,
    hopDistance: path.hopDistance
  };
}
