/**
 * src/core/problem_gen.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Formula-as-Node Graph Problem Generator
 * - Seamless integration with 40-40-20 unit distribution sampler
 * - Persistent polymorphic names & symbols across statement and solution steps
 * - Neatness pass rounding without disturbing tabulated constants
 * - Direction-Agnostic Chain-Extension Invariant for longest-chain synthesis
 * - Multi-trial graph traversal at high mastery for global longest chain discovery
 * - Backward greedy givens reduction & constant recall-mode pruning preserved
 * ============================================================================
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { parseMathAST } from "../cas/ast.js";
import { evaluatePhysicalAST } from "../cas/units/index.js";
import { phi, fib, FADING_THRESHOLD } from "../mastery/index.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { applyProblemUnitSampling, sampleSystemMode, findCoupledGroup } from "./unit_sampler.js";
import { fmtSigFig, formatGivenValue, DIMENSIONS } from "./dimensions.js";
import { valueToCoherentBase, formatValueInUnit, unitToTex } from "../cas/units/definitions.js";

export function relationWeaknessWeight(mastery = 0) {
  return Math.max(phi(-7), Math.pow((1 + phi(-6)) - mastery, fib(4)));
}

export function determineGraphDistance(mastery, maxDepth = Infinity) {
  if (mastery < phi(-2)) return 0;                               // < 38.2%: single relation (0 hops)
  if (mastery < phi(-1)) return 1;                               // < 61.8%: 1 hop (2 equations)
  if (mastery < FADING_THRESHOLD) return 2;                      // < 76.4%: 2 hops (3 equations)
  if (mastery < 1 - phi(-4)) return Math.min(fib(4), maxDepth); // < 85.4%: 3 hops
  if (mastery < 1 - phi(-5)) return Math.min(fib(5), maxDepth); // < 91.0%: 5 hops
  if (mastery < 1 - phi(-6)) return Math.min(fib(6), maxDepth); // < 94.4%: 8 hops
  return Math.min(fib(8), maxDepth);                             // >= 94.4%: maximum depth
}

export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0, terminalGoals = []) {
  const scoredNodes = relations.map(node => {
    const mastery = getMastery(node);
    const weight = relationWeaknessWeight(mastery);
    const key = weight * (phi(-1) + phi(-2) * Math.random());
    return { node, weight, key, mastery };
  });

  scoredNodes.sort((a, b) => b.key - a.key);

  const meanMastery = scoredNodes.reduce((sum, s) => sum + s.mastery, 0) / (scoredNodes.length || 1);
  const isHighMastery = meanMastery >= FADING_THRESHOLD;
  const bestCandidates = [];

  // When mastery is high across the topic, prioritize terminal goals to synthesize full-cycle chains
  if (isHighMastery && Array.isArray(terminalGoals) && terminalGoals.length > 0) {
    for (const tGoal of terminalGoals) {
      const parentRels = relations.filter(r => (r.solvable || r.nodes).includes(tGoal));
      for (const pRel of parentRels) {
        const problem = buildGraphPath(pRel, tGoal, relations, S, meanMastery);
        if (problem) bestCandidates.push(problem);
      }
    }
  }

  // Iterate through weakness-sorted nodes
  for (const { node: targetNode, mastery } of scoredNodes) {
    const candidateGoals = [...targetNode.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      if (targetNode.solvable && !targetNode.solvable.includes(goalVar)) {
        continue;
      }
      const problem = buildGraphPath(targetNode, goalVar, relations, S, mastery);
      if (problem) {
        if (!isHighMastery) {
          // At low/intermediate mastery, immediately return the weakest targeted problem
          return problem;
        }
        bestCandidates.push(problem);
      }
    }
  }

  if (bestCandidates.length > 0) {
    // When mastery approaches 100%, select the candidate that produces the longest chain
    bestCandidates.sort((a, b) => b.hopDistance - a.hopDistance);
    return bestCandidates[0];
  }

  const fallback = scoredNodes[0].node;
  const goalVar = fallback.solvable ? fallback.solvable[0] : fallback.nodes[0];
  const givens = fallback.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [], targetEqId: fallback.id, hopDistance: 0 };
}

function buildSingleGraphPath(targetNode, goalVar, relations, S, targetMastery) {
  let currentGivens = targetNode.nodes.filter(n => n !== goalVar);
  const desiredHops = determineGraphDistance(targetMastery, relations.length);

  let bestGivens = currentGivens;
  let currentSteps = solveDAG(currentGivens, S, relations, {}, () => 0);
  let currentRequired = pruneSolutionPath(currentSteps, goalVar);

  for (let h = 0; h < desiredHops; h++) {
    const expansions = [];
    const currentProduced = new Set(currentRequired.map(s => s.targetVar));

    for (const g of bestGivens) {
      // Find any relation containing g that can algebraically solve for g
      const neighborRels = relations.filter(r =>
        r.id !== targetNode.id &&
        r.nodes.includes(g) &&
        (!r.solvable || r.solvable.includes(g))
      );

      for (const nRel of neighborRels) {
        const rawNewInputs = nRel.nodes.filter(n => n !== g);
        if (rawNewInputs.includes(goalVar)) continue;

        // If an input is already produced by intermediate steps in the DAG,
        // it connects internally and must not be added to external givens
        const newInputs = rawNewInputs.filter(inp => !currentProduced.has(inp));

        const candidateSet = Array.from(new Set([
          ...bestGivens.filter(x => x !== g),
          ...newInputs
        ]));

        if (candidateSet.length <= fib(8) && canSolveTarget(candidateSet, goalVar, relations, S)) {
          const testSteps = solveDAG(candidateSet, S, relations, {}, () => 0);
          const testRequired = pruneSolutionPath(testSteps, goalVar);

          // Direction-agnostic invariant: strictly extend the solution chain
          if (testRequired.length > currentRequired.length) {
            const isLHS = (nRel.baseFormula && nRel.baseFormula.split("=")[0].trim() === g) ? 1 : 0;
            expansions.push({
              candidateSet,
              required: testRequired,
              chainLen: testRequired.length,
              isLHS
            });
          }
        }
      }
    }

    if (expansions.length === 0) break;

    // Greedily pick the expansion that maximizes chain length, preferring primary LHS equations on ties
    expansions.sort((a, b) => (b.chainLen - a.chainLen) || (b.isLHS - a.isLHS) || (Math.random() - 0.5));
    const chosen = expansions[0];
    bestGivens = chosen.candidateSet;
    currentRequired = chosen.required;
  }

  const steps = solveDAG(bestGivens, S, relations, {}, () => 0);
  const required = pruneSolutionPath(steps, goalVar);

  const usesTarget = required.some(s => s.eqId === targetNode.id || s.systemEqIds?.includes(targetNode.id));
  if (!usesTarget) return null;

  const producedVars = new Set(required.map(s => s.targetVar));
  const essentialGivensSet = new Set();

  required.forEach(step => {
    (step.nodes || []).forEach(n => {
      if (n !== step.targetVar && !producedVars.has(n)) {
        essentialGivensSet.add(n);
      }
    });
  });

  // Layer 1: Backward Greedy Givens Reduction heuristic (keeps statement lean)
  let minimalGivens = Array.from(essentialGivensSet);

  for (let i = minimalGivens.length - 1; i >= 0; i--) {
    const candidate = minimalGivens[i];
    const reducedSet = minimalGivens.filter(v => v !== candidate);

    if (canSolveTarget(reducedSet, goalVar, relations, S)) {
      minimalGivens = reducedSet;
    }
  }

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
    hopDistance: required.length - 1
  };
}

function buildGraphPath(targetNode, goalVar, relations, S, targetMastery) {
  // At high mastery, run multiple search trials (fib(5) = 5) to guarantee the longest chain is discovered
  const TRIALS = targetMastery >= FADING_THRESHOLD ? fib(5) : 1;
  let bestOfAll = null;

  for (let t = 0; t < TRIALS; t++) {
    const prob = buildSingleGraphPath(targetNode, goalVar, relations, S, targetMastery);
    if (prob && (!bestOfAll || prob.hopDistance > bestOfAll.hopDistance)) {
      bestOfAll = prob;
    }
  }
  return bestOfAll;
}

export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}, topicConfig = {}) {
  if (typeof topicConfig.statementBuilder === "function") {
    return topicConfig.statementBuilder(givens, visibleGoals, S, varsDb);
  }

  S._displayNames = S._displayNames || {};
  S._displaySymbols = S._displaySymbols || {};

  function getPolymorphicMeta(v) {
    const meta = varsDb[v] || CONSTANTS_DB[v] || {};

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
    const meta = varsDb[v] || CONSTANTS_DB[v] || {};
    const u = S._u?.[v] || meta.unit || "";
    const poly = getPolymorphicMeta(v);

    const formattedVal = formatGivenValue(val, meta);
    let valWithUnit = `$${formattedVal}$`;

    if (u && u !== "dimless" && u !== "ratio") {
      const uTex = unitToTex(u, true);
      if (u === "%") {
        valWithUnit = `$${formattedVal}\\%$`;
      } else if (u.startsWith("°")) {
        valWithUnit = `$${formattedVal}${uTex}$`;
      } else {
        valWithUnit = `$${formattedVal}\\,${uTex}$`;
      }
    }

    return `${poly.name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${poly.symbol}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const poly = getPolymorphicMeta(gVar);
    const u = S._u?.[gVar] || varsDb[gVar]?.unit || CONSTANTS_DB[gVar]?.unit || "";

    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") {
      const uTex = unitToTex(u, true);
      uStr = ` in $${uTex}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${poly.name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${poly.symbol}$</span>)</span>${uStr}`;
  });

  const systemNoun = topicConfig.noun || `${topicConfig.title || "Mechanical"} system`;
  const firstChar = (systemNoun[0] || "").toLowerCase();
  const startsWithVowel = "aeiou".includes(firstChar);
  const article = startsWithVowel ? "An" : "A";

  const goalsFormatted = goalStrings.length > 2
    ? goalStrings.slice(0, -1).join(", ") + ", and " + goalStrings[goalStrings.length - 1]
    : goalStrings.join(" and ");

  return `${article} ${systemNoun} operates with the following specifications: ${parts.join(", ")}. Determine: ${goalsFormatted}.`;
}

export function generateProblem(topic, getMastery = () => 0) {
  const { title, varsDb, relations, createSystem, terminalGoals = [] } = topic;

  // 1. Establish ground truth system with 40-40-20 unit distribution
  const targetMode = sampleSystemMode();
  let S_raw = createSystem({ sys: targetMode === "MIXED" ? "SI" : targetMode });
  S_raw = applyProblemUnitSampling(S_raw, varsDb, targetMode);

  // 2. Autonomous graph path unrolling
  const path = generateAutonomousProblem(relations, S_raw, varsDb, getMastery, terminalGoals);

  const targetRel = relations.find(r => r.id === path.targetEqId) || relations[relations.length - 1];
  const problemTitle = targetRel ? targetRel.name : `${title} Problem`;

  const S_neat = { ...S_raw };
  path.givens.forEach(g => {
    const val = S_raw[g];
    if (typeof val !== "number") return;

    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant) return;

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

  // If at high mastery multiple terminal goals are solvable from the givens, bundle them
  let targetGoals = path.goalVar;
  if (Array.isArray(terminalGoals) && terminalGoals.length > 0) {
    const reachableTerminals = terminalGoals.filter(tg => canSolveTarget(path.givens, tg, relations, S_neat));
    if (reachableTerminals.length > 0 && (Array.isArray(path.goalVar) || reachableTerminals.includes(path.goalVar))) {
      targetGoals = reachableTerminals;
    }
  }

  const solution = pruneSolutionPath(allSteps, targetGoals, getMastery, terminalGoals);

  // Unify units for deliverables in coupled groups
  const unifiedUnits = new Map();
  solution.forEach(step => {
    if (!step.isFaded) {
      const grp = findCoupledGroup(step.targetVar);
      if (grp) {
        const currentUnit = S_neat._u[step.targetVar];
        if (!unifiedUnits.has(grp)) {
          unifiedUnits.set(grp, currentUnit);
        } else {
          const targetUnit = unifiedUnits.get(grp);
          if (currentUnit !== targetUnit) {
            const meta = varsDb[step.targetVar] || {};
            const isDiff = meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;
            const coherentVal = valueToCoherentBase(step.expectedVal, currentUnit, isDiff);
            const newVal = formatValueInUnit(coherentVal, targetUnit, isDiff);
            S_neat[step.targetVar] = newVal;
            S_neat._u[step.targetVar] = targetUnit;
            step.expectedVal = newVal;
          }
        }
      }
    }
  });

  solution.forEach(step => {
    if (step.isFaded) {
      step.isAnswered = true;
      step.isRevealed = true;
      step.userVal = step.expectedVal;
    }
  });

  // Layer 2: Constant recall-mode pruning heuristic
  const statementGivens = path.givens.filter(g => {
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant) {
      const constantMastery = getMastery({ id: `const_${g}` });
      if (constantMastery >= FADING_THRESHOLD) {
        return false;
      }
    }
    return true;
  });

  // Layer 3: Cognitive fading step hiding
  const visibleGoals = solution.filter(s => !s.isFaded).map(s => s.targetVar);
  const statement = buildProblemStatement(statementGivens, visibleGoals, S_neat, varsDb, topic);

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
