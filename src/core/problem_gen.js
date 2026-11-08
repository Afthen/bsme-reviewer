/**
 * src/core/problem_gen.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Formula-as-Node Graph Problem Generator
 * ============================================================================
 * PHILOSOPHY:
 * 1. Cognitive Scaffolding:
 *    Problem hop distance scales dynamically based on Golden Ratio breakpoints:
 *      - Mastery < 38.2% (phi(-2)): Single direct formula (0 hops)
 *      - 38.2% to 61.8% (phi(-1)): Two formulas with 1 bridge variable (1 hop)
 *      - 61.8% to 76.4% (Fading): Multi-step synthesis chain (2 hops)
 *      - Mastery >= 76.4%: Deep graph walking (fib(4) hops)
 * 2. Strict Mathematical Minimality (Greedy Irreducibility):
 *    Extracts true root leaf nodes from the pruned solution DAG and greedily
 *    prunes redundant degrees of freedom, guaranteeing that non-distractor
 *    givens represent the exact minimum parameters needed to reach the goal.
 * 3. Board-Exam Distractor Injection (phi(-4)):
 *    Injects variables not needed in the solution path based on phi(-4) (~14.6%).
 * 4. Polymorphic Variable & Symbol Randomization:
 *    Randomizes the human term name and symbol in the problem statement prompt
 *    to train student agility across board-exam synonym variations, while
 *    keeping algebraic derivations strictly anchored to canonical notation.
 * 5. The "Textbook Curation" Principle (Neat Givens):
 *    Rounds givens to clean numbers using fmtSigFig, then re-evaluates the
 *    downstream AST path so student answers match calculated values perfectly.
 * ============================================================================
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { parseMathAST } from "../cas/ast.js";
import { evaluatePhysicalAST } from "../cas/units/index.js";
import { phi, fib, FADING_THRESHOLD } from "../mastery/index.js";
import { fmtSigFig } from "./dimensions.js";

function determineGraphDistance(mastery) {
  if (mastery < phi(-2)) return 0;           // < 38.2%
  if (mastery < phi(-1)) return 1;            // < 61.8%
  if (mastery < FADING_THRESHOLD) return 2;   // < 76.4%
  return fib(4);                              // >= 76.4% (3 hops)
}

export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
  const scoredNodes = relations.map(node => {
    const mastery = getMastery(node);
    const weight = Math.max(phi(-7), Math.pow((1 + phi(-6)) - mastery, fib(4)));
    const key = weight * (phi(-1) + phi(-2) * Math.random());
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

          if (candidateSet.length <= fib(6) && canSolveTarget(candidateSet, goalVar, relations)) {
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

  // ==========================================================================
  // PHASE 1: LEAF-NODE EXTRACTION (ERADICATES PHANTOM GIVENS)
  // ==========================================================================
  const producedVars = new Set(required.map(s => s.targetVar));
  const essentialGivensSet = new Set();

  required.forEach(step => {
    (step.nodes || []).forEach(n => {
      // If a variable is needed by a step, but never produced by any prior step,
      // it is a root dependency that must be provided in the givens.
      if (n !== step.targetVar && !producedVars.has(n)) {
        essentialGivensSet.add(n);
      }
    });
  });

  // ==========================================================================
  // PHASE 2: GREEDY IRREDUCIBILITY PRUNING (GUARANTEES STRICT MINIMALITY)
  // ==========================================================================
  let minimalGivens = Array.from(essentialGivensSet);

  for (let i = minimalGivens.length - 1; i >= 0; i--) {
    const candidate = minimalGivens[i];
    const reducedSet = minimalGivens.filter(v => v !== candidate);

    // If the goal is still 100% solvable without this given, it is mathematically redundant!
    if (canSolveTarget(reducedSet, goalVar, relations)) {
      minimalGivens = reducedSet;
    }
  }

  // ==========================================================================
  // PHASE 3: DISTRACTOR SELECTION (PHI^-4 THRESHOLD: ~14.6%)
  // ==========================================================================
  const usedVars = new Set(required.flatMap(s => s.nodes || [s.targetVar]));
  minimalGivens.forEach(g => usedVars.add(g));

  const candidateDistractors = Object.keys(S).filter(k =>
    !k.startsWith("_") && !usedVars.has(k) && typeof S[k] === "number" && !isNaN(S[k])
  );

  const distractors = candidateDistractors.length > 0 && Math.random() < phi(-4)
    ? [candidateDistractors[Math.floor(Math.random() * candidateDistractors.length)]]
    : [];

  return {
    goalVar,
    givens: Array.from(new Set([...minimalGivens, ...distractors])).sort(),
    distractors,
    targetEqId: targetNode.id,
    hopDistance: bestPath.hops
  };
}

export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}, topicConfig = {}) {
  if (typeof topicConfig.statementBuilder === "function") {
    return topicConfig.statementBuilder(givens, visibleGoals, S, varsDb);
  }

  S._displayNames = S._displayNames || {};
  S._displaySymbols = S._displaySymbols || {};

  // Polymorphic Selection Helper: Pick a random human name and symbol from aliases
  function getPolymorphicMeta(v) {
    const meta = varsDb[v] || {};
    
    if (!S._displayNames[v]) {
      const names = meta.nameAliases && meta.nameAliases.length > 0 ? meta.nameAliases : [meta.name || v];
      S._displayNames[v] = names[Math.floor(Math.random() * names.length)];
    }
    
    if (!S._displaySymbols[v]) {
      const symbols = meta.symbolAliases && meta.symbolAliases.length > 0 ? meta.symbolAliases : [meta.symbol || v];
      S._displaySymbols[v] = symbols[Math.floor(Math.random() * symbols.length)];
    }

    return {
      name: S._displayNames[v],
      symbol: S._displaySymbols[v]
    };
  }

  const parts = givens.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    const poly = getPolymorphicMeta(v);

    const formattedVal = fmtSigFig(val, 6);
    let valWithUnit = `$${formattedVal}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      valWithUnit = (u === "deg" || u === "°") ? `$${formattedVal}^\\circ$` : `$${formattedVal}\\text{ ${u}}$`;
    }

    return `${poly.name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${poly.symbol}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const poly = getPolymorphicMeta(gVar);
    const u = S._u?.[gVar] || varsDb[gVar]?.unit || "";

    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") {
      uStr = (u === "deg" || u === "°") ? " in ^\\circ" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${poly.name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${poly.symbol}$</span>)</span>${uStr}`;
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

  // Only active, non-faded steps appear in the "Determine: X, Y, and Z" prompt!
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
