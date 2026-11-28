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
import {
  applyProblemUnitSampling, planProblemUnits, sampleSystemMode,
  findCoupledGroup, smallerUnitsFor, largerUnitsFor, retainsSufficientSigFigs, snapClean
} from "./unit_sampler.js";
import { fmtSigFig, formatGivenValue, DIMENSIONS, displayFloorOk, MIN_DISPLAY_FLOOR } from "./dimensions.js";
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

  const unitSpan = (varKey, tex) => `<span class="interactive-unit" data-var="${varKey}">$${tex}$</span>`;

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
    const isSci = Boolean(S._sciVars && S._sciVars.has(v));
    const formattedVal = formatGivenValue(val, meta, true, u, { scientific: isSci });
    let valWithUnit = `$${formattedVal}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      const uTex = unitToTex(u, true, meta.dimension);
      if (u === "%") valWithUnit = `$${formattedVal}$${unitSpan(v, "\\%")}`;
      else if (u.startsWith("°")) valWithUnit = `$${formattedVal}$${unitSpan(v, uTex)}`;
      else valWithUnit = `$${formattedVal}$${unitSpan(v, `\\,${uTex}`)}`;
    }
    return `${poly.name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${poly.symbol}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const poly = getPolymorphicMeta(gVar);
    const gMeta = varsDb[gVar] || CONSTANTS_DB[gVar] || {};
    const u = S._u?.[gVar] || gMeta.unit || "";
    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") uStr = ` in ${unitSpan(gVar, unitToTex(u, true, gMeta.dimension))}`;
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
const MAX_FLOOR_RECURSION = 8;

function valueFailsDisplayTest(val, meta = {}) {
  if (meta.isConstant) return false;
  if (typeof val !== "number" || !Number.isFinite(val)) return true;
  if (!displayFloorOk(val)) return true;
  return Math.abs(val) > 9.99e6;
}

function collectFailingVars(state, varsDb, givens, includeFaded = false) {
  const failing = [];
  const seen = new Set();
  for (const g of givens) {
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (valueFailsDisplayTest(state.S_display[g], meta)) {
      failing.push({ key: g, val: state.S_display[g], isGiven: true, meta });
      seen.add(g);
    }
  }
  for (const s of state.solution) {
    if (!includeFaded && s.isFaded) continue;
    const meta = varsDb[s.targetVar] || {};
    if (!seen.has(s.targetVar) && valueFailsDisplayTest(s.expectedVal, meta)) {
      failing.push({ key: s.targetVar, val: s.expectedVal, isGiven: false, meta });
      seen.add(s.targetVar);
    }
  }
  return failing;
}

function cloneSystemState(S) {
  return {
    ...S,
    _u: { ...(S._u || {}) },
    _names: S._names ? { ...S._names } : undefined,
    _displayNames: S._displayNames ? { ...S._displayNames } : undefined,
    _displaySymbols: S._displaySymbols ? { ...S._displaySymbols } : undefined
  };
}

function cloneSteps(steps) {
  return steps.map(s => ({
    ...s,
    nodes: s.nodes ? [...s.nodes] : [],
    parentIndices: s.parentIndices ? [...s.parentIndices] : [],
    ancestorIndices: s.ancestorIndices ? [...s.ancestorIndices] : [],
    fadedAncestorEqIds: s.fadedAncestorEqIds ? [...s.fadedAncestorEqIds] : []
  }));
}

function recomputeSolutionState(S_input, path, allStepsTemplate, relations, varsDb, getMastery) {
  const S_truth = cloneSystemState(S_input);
  const allSteps = cloneSteps(allStepsTemplate);

  for (const step of allSteps) {
    const ast = parseMathAST(step.rhsExpr);
    const { value } = evaluatePhysicalAST(ast, S_truth, step.targetVar, varsDb, step.requiredUnits);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false };
    }
    S_truth[step.targetVar] = value;
    step.expectedVal = value;
  }

  const solution = pruneSolutionPath(allSteps, path.goalVar, getMastery);

  const S_display = cloneSystemState(S_truth);
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

  return { ok: true, S_truth, S_display, allSteps, solution };
}

function trySwitchUnitScale(state, item, path, relations, varsDb, getMastery, targetMode) {
  const { key, val, isGiven, meta } = item;
  const currU = state.S_truth._u?.[key] || meta.unit || "";
  if (!currU || currU === "dimless" || currU === "ratio" || !meta.dimension) return null;

  const isTooLarge = Math.abs(val) > 9.99e6;
  const unitCands = isTooLarge
    ? largerUnitsFor(currU, meta.dimension, targetMode)
    : smallerUnitsFor(currU, meta.dimension, targetMode);
  if (unitCands.length === 0) return null;

  const scored = unitCands
    .map(u => ({ u, v: convertUnitValue(val, currU, u, meta.dimension) }))
    .filter(c => !valueFailsDisplayTest(c.v, meta));
  if (scored.length === 0) return null;

  // Prefer units that also satisfy retainsSufficientSigFigs, keeping closest scale order.
  scored.sort((a, b) => (retainsSufficientSigFigs(b.v) ? 1 : 0) - (retainsSufficientSigFigs(a.v) ? 1 : 0));

  const coupledGrp = !isGiven ? findCoupledGroup(key) : null;
  const beforeFails = collectFailingVars(state, varsDb, path.givens, false).length;

  for (const { u: candU } of scored) {
    const S_next = cloneSystemState(state.S_truth);
    S_next._u[key] = candU;
    S_next[key] = convertUnitValue(state.S_truth[key], currU, candU, meta.dimension);

    if (coupledGrp) {
      for (const s of state.solution) {
        if (!s.isFaded && coupledGrp.has(s.targetVar) && s.targetVar !== key) {
          const sCurrU = S_next._u?.[s.targetVar] || varsDb[s.targetVar]?.unit;
          const sDim = varsDb[s.targetVar]?.dimension;
          if (sCurrU && sCurrU !== candU) {
            S_next[s.targetVar] = convertUnitValue(S_next[s.targetVar], sCurrU, candU, sDim);
            S_next._u[s.targetVar] = candU;
          }
        }
      }
    }

    const nextState = recomputeSolutionState(S_next, path, state.allSteps, relations, varsDb, getMastery);
    if (!nextState.ok) continue;
    const stillFailsSelf = collectFailingVars(nextState, varsDb, path.givens, false).some(f => f.key === key);
    const afterFails = collectFailingVars(nextState, varsDb, path.givens, false).length;
    if (!stillFailsSelf && afterFails <= beforeFails) {
      return nextState;
    }
  }
  return null;
}

function liftTargetAboveFloor(currVal, meta = {}) {
  const sign = currVal < 0 ? -1 : 1;
  let mag = Math.abs(currVal);
  if (mag === 0) return null;
  const targetFloor = MIN_DISPLAY_FLOOR * 2;
  while (mag < targetFloor) mag *= 10;
  let lifted = sign * snapClean(mag);
  if (Math.abs(lifted) < MIN_DISPLAY_FLOOR) lifted = sign * targetFloor;
  if (Array.isArray(meta.typical) && meta.typical.length >= 2) {
    const [lo, hi] = meta.typical;
    if (hi >= MIN_DISPLAY_FLOOR) {
      lifted = Math.min(hi, Math.max(Math.max(MIN_DISPLAY_FLOOR, lo), lifted));
    }
  }
  return lifted;
}

function backsolveVariableToGiven(S_work, targetKey, targetVal, path, allSteps, varsDb, activeChain) {
  const meta = varsDb[targetKey] || CONSTANTS_DB[targetKey] || {};
  if (meta.isConstant) return null;
  if (!Number.isFinite(targetVal)) return null;
  const oldVal = S_work[targetKey];
  if (typeof oldVal === "number" && oldVal !== 0 && (oldVal > 0) !== (targetVal > 0)) return null;

  if (path.givens.includes(targetKey)) {
    const finalVal = meta.isInteger ? Math.round(targetVal) : targetVal;
    if (finalVal === 0 && oldVal !== 0) return null;
    const S_out = cloneSystemState(S_work);
    S_out[targetKey] = finalVal;
    return S_out;
  }

  const step = allSteps.find(s => s.targetVar === targetKey);
  if (!step) return null;

  const candidates = (step.nodes || []).filter(n => n !== targetKey && !activeChain.has(n));
  // Prefer direct root givens first so perturbation stays minimal.
  candidates.sort((a, b) => (path.givens.includes(b) ? 1 : 0) - (path.givens.includes(a) ? 1 : 0));

  for (const inp of candidates) {
    const inpMeta = varsDb[inp] || CONSTANTS_DB[inp] || {};
    if (inpMeta.isConstant) continue;
    const iso = isolateVariable(step.baseFormula, inp, varsDb);
    if (!iso.success) continue;

    const S_eval = cloneSystemState(S_work);
    S_eval[targetKey] = targetVal;
    const { value: solvedInp } = evaluatePhysicalAST(
      parseMathAST(iso.isolatedRhs), S_eval, inp, varsDb, step.requiredUnits
    );
    if (typeof solvedInp !== "number" || !Number.isFinite(solvedInp)) continue;

    const oldInp = S_work[inp];
    if (typeof oldInp === "number" && oldInp !== 0 && (oldInp > 0) !== (solvedInp > 0)) continue;

    const nextChain = new Set(activeChain);
    nextChain.add(targetKey);
    const resultS = backsolveVariableToGiven(S_eval, inp, solvedInp, path, allSteps, varsDb, nextChain);
    if (resultS) return resultS;
  }
  return null;
}

function tryBacksolve(state, item, path, relations, varsDb, getMastery) {
  const { key, val, isGiven, meta } = item;
  if (isGiven || meta.isConstant || val === 0 || !Number.isFinite(val)) return null;

  const targetVal = Math.abs(val) > 9.99e6
    ? (val < 0 ? -1 : 1) * snapClean(Math.min(Math.abs(val), 1e5))
    : liftTargetAboveFloor(val, meta);
  if (targetVal === null || valueFailsDisplayTest(targetVal, meta)) return null;

  const S_back = backsolveVariableToGiven(
    state.S_truth, key, targetVal, path, state.allSteps, varsDb, new Set()
  );
  if (!S_back) return null;

  const nextState = recomputeSolutionState(S_back, path, state.allSteps, relations, varsDb, getMastery);
  if (!nextState.ok) return null;

  const newTargetVal = nextState.S_truth[key];
  if (valueFailsDisplayTest(newTargetVal, meta)) return null;
  return nextState;
}

function resolveDisplayFloor(state, path, relations, varsDb, getMastery, targetMode, depth = 0, backsolvedVars = new Set()) {
  const failing = collectFailingVars(state, varsDb, path.givens, false);
  if (failing.length === 0 || depth >= MAX_FLOOR_RECURSION) {
    return state;
  }

  // Tier 1: switch any failing variable to a smaller (or larger) unit scale first.
  for (const item of failing) {
    const switched = trySwitchUnitScale(state, item, path, relations, varsDb, getMastery, targetMode);
    if (switched) {
      return resolveDisplayFloor(switched, path, relations, varsDb, getMastery, targetMode, depth + 1, backsolvedVars);
    }
  }

  // Tier 2: backsolve from the failing variable, then recursively try Tier 1 again across all variables.
  let bestState = state;
  let bestFailCount = failing.length;

  for (const item of failing) {
    if (item.isGiven || backsolvedVars.has(item.key)) continue;
    const backsolved = tryBacksolve(state, item, path, relations, varsDb, getMastery);
    if (!backsolved) continue;

    const nextBacksolved = new Set(backsolvedVars);
    nextBacksolved.add(item.key);
    const resolved = resolveDisplayFloor(backsolved, path, relations, varsDb, getMastery, targetMode, depth + 1, nextBacksolved);
    const resolvedFailCount = collectFailingVars(resolved, varsDb, path.givens, false).length;
    if (resolvedFailCount === 0) return resolved;
    if (resolvedFailCount < bestFailCount) {
      bestState = resolved;
      bestFailCount = resolvedFailCount;
    }
  }

  return bestState;
}

export function generateProblem(topic, getMastery = () => 0, options = {}) {
  let lastError = null;
  for (let i = 0; i < MAX_DRAW_ATTEMPTS; i++) {
    try {
      const problem = buildProblemOnce(topic, getMastery, options);
      if (problem) return problem;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed to generate valid problem after ${MAX_DRAW_ATTEMPTS} draws (${topic.id})`);
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

  const initialSteps = solveDAG(path.givens, S_truth, relations, varsDb, () => 0);
  const initialState = recomputeSolutionState(S_truth, path, initialSteps, relations, varsDb, getMastery);
  if (!initialState.ok) throw new Error(`Non-finite evaluation in ${topic.id}`);

  // Hierarchical & recursive display floor resolution (Tier 1 -> Tier 2 -> recursive Tier 1 -> Tier 3).
  const resolved = resolveDisplayFloor(initialState, path, relations, varsDb, getMastery, targetMode);

  // Tier 3: collect all remaining failing numbers (across givens and steps) and switch to scientific notation.
  const sciVars = new Set(
    collectFailingVars(resolved, varsDb, path.givens, true).map(f => f.key)
  );
  if (sciVars.size > 0) {
    resolved.S_truth._sciVars = sciVars;
    resolved.S_display._sciVars = sciVars;
  }

  const statementGivens = path.givens.filter(g => {
    const meta = varsDb[g] || CONSTANTS_DB[g] || {};
    if (meta.isConstant && getMastery({ id: `const_${g}` }) >= FADING_THRESHOLD) return false;
    return true;
  });

  const visibleGoals = resolved.solution.filter(s => !s.isFaded).map(s => s.targetVar);
  const statement = buildProblemStatement(statementGivens, visibleGoals, resolved.S_display, varsDb, topic);

  return {
    title: problemTitle,
    statement,
    solution: resolved.solution,
    solutionSteps: resolved.solution,
    allSteps: resolved.allSteps,
    givens: path.givens,
    distractors: path.distractors,
    system: resolved.S_truth, // Return high-precision truth to solve "Alien Scale" issue
    varsDb,
    relations,
    sciVars,
    topicId: topic.id,
    hopDistance: path.hopDistance
  };
}
