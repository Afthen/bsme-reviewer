/**
 * src/core/problem_gen.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Formula-as-Node Graph Problem Generator
 * ============================================================================
 */

import { solveDAG, canSolveTarget, pruneSolutionPath } from "./graph_solver.js";
import { parseMathAST } from "../cas/ast.js";
import { isolateVariable } from "../cas/algebra.js";
import { evaluatePhysicalAST } from "../cas/units/index.js";
import { phi, fib, FADING_THRESHOLD } from "../mastery/index.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { applyProblemUnitSampling, planProblemUnits, sampleSystemMode, findCoupledGroup } from "./unit_sampler.js";
import { fmtSigFig, formatGivenValue, DIMENSIONS, displayFloorOk } from "./dimensions.js";
import { getUnitKind, toDeltaUnit, toPointUnit, convertUnitValue, unitToTex } from "../cas/units/definitions.js";

export function relationWeaknessWeight(mastery = 0) {
  return Math.max(phi(-7), Math.pow((1 + phi(-6)) - mastery, fib(4)));
}

export function determineGraphDistance(mastery, maxDepth = Infinity) {
  if (mastery < phi(-2)) return 0;
  if (mastery < phi(-1)) return 1;
  if (mastery < FADING_THRESHOLD) return 2;
  if (mastery < 1 - phi(-4)) return Math.min(fib(4), maxDepth);
  if (mastery < 1 - phi(-5)) return Math.min(fib(5), maxDepth);
  if (mastery < 1 - phi(-6)) return Math.min(fib(6), maxDepth);
  return Math.min(fib(8), maxDepth);
}

function isRelSolvableFor(rel, varKey, varsDb = {}) {
  const bf = rel.baseFormula || (rel.canonical ? `${rel.canonical.lhs} = ${rel.canonical.rhs}` : "");
  return isolateVariable(bf, varKey, varsDb).success;
}

export function generateAutonomousProblem(relations, S, varsDb = {}, getMastery = () => 0) {
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

  for (const { node: targetNode, mastery } of scoredNodes) {
    const candidateGoals = [...targetNode.nodes].sort(() => Math.random() - 0.5);

    for (const goalVar of candidateGoals) {
      const meta = varsDb[goalVar] || CONSTANTS_DB[goalVar] || {};
      if (meta.isConstant) continue;

      if (!isRelSolvableFor(targetNode, goalVar, varsDb)) continue;

      const problem = buildGraphPath(targetNode, goalVar, relations, S, mastery, varsDb);
      if (problem) {
        if (!isHighMastery) return problem;
        bestCandidates.push(problem);
      }
    }
  }

  if (bestCandidates.length > 0) {
    bestCandidates.sort((a, b) => b.hopDistance - a.hopDistance);
    return bestCandidates[0];
  }

  const fallback = scoredNodes[0].node;
  const goalVar = fallback.nodes.find(n => !(varsDb[n] || CONSTANTS_DB[n])?.isConstant) || fallback.nodes[0];
  const givens = fallback.nodes.filter(n => n !== goalVar);
  return { goalVar, givens, distractors: [], targetEqId: fallback.id, hopDistance: 0 };
}

function buildSingleGraphPath(targetNode, goalVar, relations, S, targetMastery, varsDb = {}) {
  let currentGivens = targetNode.nodes.filter(n => n !== goalVar);
  const desiredHops = determineGraphDistance(targetMastery, relations.length);

  let bestGivens = currentGivens;
  let currentSteps = solveDAG(currentGivens, S, relations, varsDb, () => 0);
  let currentRequired = pruneSolutionPath(currentSteps, goalVar);
  const usedRelIds = new Set([targetNode.id]);

  for (let h = 0; h < desiredHops; h++) {
    const expansions = [];
    const currentProduced = new Set(currentRequired.map(s => s.targetVar));

    for (const g of bestGivens) {
      const neighborRels = relations.filter(r =>
        !usedRelIds.has(r.id) &&
        r.nodes.includes(g) &&
        isRelSolvableFor(r, g, varsDb)
      );

      for (const nRel of neighborRels) {
        const rawNewInputs = nRel.nodes.filter(n => n !== g);
        if (rawNewInputs.includes(goalVar)) continue;

        const newInputs = rawNewInputs.filter(inp => !currentProduced.has(inp));
        const candidateSet = Array.from(new Set([...bestGivens.filter(x => x !== g), ...newInputs]));

        if (candidateSet.length <= fib(8) && canSolveTarget(candidateSet, goalVar, relations, S)) {
          const testSteps = solveDAG(candidateSet, S, relations, varsDb, () => 0);
          const testRequired = pruneSolutionPath(testSteps, goalVar);

          if (testRequired.length > currentRequired.length) {
            const isLHS = (nRel.baseFormula && nRel.baseFormula.split("=")[0].trim() === g) ? 1 : 0;
            expansions.push({
              candidateSet,
              required: testRequired,
              chainLen: testRequired.length,
              isLHS,
              relId: nRel.id
            });
          }
        }
      }
    }

    if (expansions.length === 0) break;
    expansions.sort((a, b) => (b.chainLen - a.chainLen) || (b.isLHS - a.isLHS) || (Math.random() - 0.5));
    const chosen = expansions[0];
    bestGivens = chosen.candidateSet;
    currentRequired = chosen.required;
    if (chosen.relId) usedRelIds.add(chosen.relId);
  }

  const steps = solveDAG(bestGivens, S, relations, varsDb, () => 0);
  const required = pruneSolutionPath(steps, goalVar);
  if (!required.some(s => s.eqId === targetNode.id)) return null;

  const producedVars = new Set(required.map(s => s.targetVar));
  const essentialGivensSet = new Set();
  required.forEach(step => {
    (step.nodes || []).forEach(n => {
      if (n !== step.targetVar && !producedVars.has(n)) essentialGivensSet.add(n);
    });
  });

  const producibleVars = new Set(relations.flatMap(r => r.nodes.filter(n => isRelSolvableFor(r, n, varsDb))));
  let minimalGivens = Array.from(essentialGivensSet).sort((a, b) => {
    const aProducible = producibleVars.has(a) ? 1 : 0;
    const bProducible = producibleVars.has(b) ? 1 : 0;
    return bProducible - aProducible;
  });

  for (let i = 0; i < minimalGivens.length; i++) {
    const candidate = minimalGivens[i];
    const reducedSet = minimalGivens.filter(v => v !== candidate);
    if (canSolveTarget(reducedSet, goalVar, relations, S)) {
      minimalGivens = reducedSet;
      i--;
    }
  }

  const finalSteps = solveDAG(minimalGivens, S, relations, varsDb, () => 0);
  const finalRequired = pruneSolutionPath(finalSteps, goalVar);
  const finalUsedVars = new Set(finalRequired.flatMap(s => s.nodes || [s.targetVar]));
  minimalGivens.forEach(g => finalUsedVars.add(g));

  let distractors = [];
  if (Math.random() < phi(-4)) {
    const candidateDistractors = Object.keys(S).filter(k => {
      if (k.startsWith("_") || finalUsedVars.has(k) || typeof S[k] !== "number" || isNaN(S[k])) return false;
      const isAlternative = minimalGivens.length === 0
        ? canSolveTarget([k], goalVar, relations, S)
        : minimalGivens.some(g => canSolveTarget(minimalGivens.filter(v => v !== g).concat(k), goalVar, relations, S));
      return !isAlternative;
    });
    if (candidateDistractors.length > 0) {
      distractors = [candidateDistractors[Math.floor(Math.random() * candidateDistractors.length)]];
    }
  }

  return {
    goalVar,
    givens: Array.from(new Set([...minimalGivens, ...distractors])).sort(),
    distractors,
    targetEqId: targetNode.id,
    hopDistance: Math.max(0, finalRequired.length - 1)
  };
}

function buildGraphPath(targetNode, goalVar, relations, S, targetMastery, varsDb = {}) {
  const TRIALS = targetMastery >= FADING_THRESHOLD ? fib(5) : 1;
  let bestOfAll = null;
  for (let t = 0; t < TRIALS; t++) {
    const prob = buildSingleGraphPath(targetNode, goalVar, relations, S, targetMastery, varsDb);
    if (prob && (!bestOfAll || prob.hopDistance > bestOfAll.hopDistance)) bestOfAll = prob;
  }
  return bestOfAll;
}

export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}, topicConfig = {}) {
  if (typeof topicConfig.statementBuilder === "function") return topicConfig.statementBuilder(givens, visibleGoals, S, varsDb);

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
    return { name: S._displayNames[v], symbol: S._displaySymbols[v] };
  }

  const parts = givens.map(v => {
    const val = S[v];
    const meta = varsDb[v] || CONSTANTS_DB[v] || {};
    const u = S._u?.[v] || meta.unit || "";
    const poly = getPolymorphicMeta(v);
    const formattedVal = formatGivenValue(val, meta, true, u);
    let valWithUnit = `$${formattedVal}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      const uTex = unitToTex(u, true, meta.dimension);
      if (u === "%") valWithUnit = `$${formattedVal}\\%$`;
      else if (u.startsWith("°")) valWithUnit = `$${formattedVal}${uTex}$`;
      else valWithUnit = `$${formattedVal}\\,${uTex}$`;
    }
    return `${poly.name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${poly.symbol}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const poly = getPolymorphicMeta(gVar);
    const gMeta = varsDb[gVar] || CONSTANTS_DB[gVar] || {};
    const u = S._u?.[gVar] || gMeta.unit || "";
    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") uStr = ` in $${unitToTex(u, true, gMeta.dimension)}$`;
    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${poly.name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${poly.symbol}$</span>)</span>${uStr}`;
  });

  const systemNoun = topicConfig.noun || `${topicConfig.title || "Mechanical"} system`;
  const article = "aeiou".includes((systemNoun[0] || "").toLowerCase()) ? "An" : "A";
  const goalsFormatted = goalStrings.length > 2
    ? goalStrings.slice(0, -1).join(", ") + ", and " + goalStrings[goalStrings.length - 1]
    : goalStrings.join(" and ");

  return `${article} ${systemNoun} operates with the following specifications: ${parts.join(", ")}. Determine: ${goalsFormatted}.`;
}

const MAX_DRAW_ATTEMPTS = 20;

/** First displayed non-constant value (given or active answer) below the display floor, or null. */
function firstFloorViolation(problem) {
  const { system, varsDb, givens, solution } = problem;
  for (const g of givens) {
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant) continue;
    if (typeof system[g] === "number" && !displayFloorOk(system[g])) return `given ${g}=${system[g]} ${system._u?.[g] || ""}`;
  }
  for (const s of solution) {
    if (s.isFaded) continue;
    const meta = varsDb[s.targetVar] || {};
    if (meta.isConstant) continue;
    if (typeof s.expectedVal === "number" && !displayFloorOk(s.expectedVal)) {
      return `answer ${s.targetVar}=${s.expectedVal} ${system._u?.[s.targetVar] || ""}`;
    }
  }
  return null;
}

export function generateProblem(topic, getMastery = () => 0, options = {}) {
  let violation = null;
  for (let i = 0; i < MAX_DRAW_ATTEMPTS; i++) {
    const problem = buildProblemOnce(topic, getMastery, options);
    violation = firstFloorViolation(problem);
    if (!violation) return problem;
  }
  throw new Error(`Display floor unmet after ${MAX_DRAW_ATTEMPTS} draws (${topic.id}): ${violation}; its unit is wrong or the topic data is out of range`);
}

function buildProblemOnce(topic, getMastery = () => 0, options = {}) {
  let { title, varsDb, relations, createSystem } = topic;
  if (typeof topic.instantiate === "function" && Array.isArray(topic.countRange)) {
    const [minN, maxN] = topic.countRange;
    const n = minN + Math.floor(Math.random() * (maxN - minN + 1));
    const inst = topic.instantiate(n);
    varsDb = inst.varsDb;
    relations = inst.relations;
    createSystem = inst.createSystem;
  }

  const targetMode = sampleSystemMode(options?.mode ?? null);
  const unitPlan = planProblemUnits(varsDb, targetMode);
  let S_truth = createSystem({ sys: targetMode === "MIXED" ? "SI" : targetMode, unitPlan });
  S_truth = applyProblemUnitSampling(S_truth, varsDb, targetMode, unitPlan);

  const path = generateAutonomousProblem(relations, S_truth, varsDb, getMastery);
  const targetRel = relations.find(r => r.id === path.targetEqId) || relations[relations.length - 1];
  const problemTitle = targetRel ? targetRel.name : `${title} Problem`;

  const allSteps = solveDAG(path.givens, S_truth, relations, varsDb, () => 0);
  allSteps.forEach(step => {
    const ast = parseMathAST(step.rhsExpr);
    const { value } = evaluatePhysicalAST(ast, S_truth, step.targetVar, varsDb, step.requiredUnits);
    S_truth[step.targetVar] = value;
    step.expectedVal = value;
  });

  const solution = pruneSolutionPath(allSteps, path.goalVar, getMastery);

  // Presentation State (S_display) is only for the Statement and UI.
  const S_display = { ...S_truth, _u: { ...S_truth._u } };
  path.givens.forEach(g => {
    const val = S_truth[g];
    if (typeof val !== "number") return;
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant) return;
    S_display[g] = meta.isInteger ? Math.round(val) : parseFloat(val.toPrecision(6));
  });

  const unifiedUnits = new Map();
  solution.forEach(step => {
    if (!step.isFaded) {
      const grp = findCoupledGroup(step.targetVar);
      if (grp) {
        const currentUnit = S_truth._u[step.targetVar];
        if (!unifiedUnits.has(grp)) {
          unifiedUnits.set(grp, currentUnit);
        } else {
          const rawTargetUnit = unifiedUnits.get(grp);
          const curKind = getUnitKind(currentUnit);
          const tgtKind = getUnitKind(rawTargetUnit);
          let targetUnit = rawTargetUnit;
          if (curKind === "delta" && tgtKind === "point") targetUnit = toDeltaUnit(rawTargetUnit);
          else if (curKind === "point" && tgtKind === "delta") targetUnit = toPointUnit(rawTargetUnit);

          if (currentUnit !== targetUnit) {
            const meta = varsDb[step.targetVar] || {};
            const newVal = convertUnitValue(step.expectedVal, currentUnit, targetUnit, meta.dimension);
            S_truth[step.targetVar] = newVal;
            S_truth._u[step.targetVar] = targetUnit;
            S_display[step.targetVar] = newVal;
            S_display._u[step.targetVar] = targetUnit;
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

  const statementGivens = path.givens.filter(g => {
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant && getMastery({ id: `const_${g}` }) >= FADING_THRESHOLD) return false;
    return true;
  });

  const visibleGoals = solution.filter(s => !s.isFaded).map(s => s.targetVar);
  const statement = buildProblemStatement(statementGivens, visibleGoals, S_display, varsDb, topic);

  return {
    title: problemTitle,
    statement,
    solution,
    solutionSteps: solution,
    allSteps,
    givens: path.givens,
    distractors: path.distractors,
    system: S_truth, // Return high-precision truth to solve "Alien Scale" issue
    varsDb,
    relations,
    topicId: topic.id,
    hopDistance: path.hopDistance
  };
}
