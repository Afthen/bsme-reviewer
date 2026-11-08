/**
 * src/core/graph_solver.js
 * Formulas-as-Nodes / Variables-as-Edges Solver Engine.
 * Dynamically resolves SI/US variants and requiredUnits contracts.
 */

import { isolateVariable } from "../cas/algebra.js";
import { FADING_THRESHOLD } from "../src/mastery/index.js";

export function solveDAG(givensArray, S, relations = [], varsDb = {}, getMastery = () => 0) {
  const known = new Set(givensArray);
  const steps = [];
  const usedEquations = new Set();
  const producedBy = {};
  let keepPropagating = true;

  const sortedRelations = [...relations].sort((a, b) => getMastery(a) - getMastery(b));

  while (keepPropagating) {
    keepPropagating = false;

    for (const eq of sortedRelations) {
      if (usedEquations.has(eq.id)) continue;

      const activeVariant = (eq.variants && S && S.sys && eq.variants[S.sys]) ? eq.variants[S.sys] : null;
      const eqNodes = activeVariant?.nodes || eq.nodes;

      const unknowns = eqNodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];

        if (eq.solvable && !eq.solvable.includes(targetVar)) {
          continue;
        }

        const inputVars = eqNodes.filter(n => n !== targetVar);
        const baseFormula = activeVariant?.baseFormula || eq.baseFormula || (eq.canonical ? `${eq.canonical.lhs} = ${eq.canonical.rhs}` : "");
        const canonicalTex = activeVariant?.canonicalTex || eq.canonicalTex || eq.canonical?.tex || eq.baseFormula || baseFormula;
        const requiredUnits = activeVariant?.requiredUnits || eq.requiredUnits || null;

        const isolated = isolateVariable(baseFormula, targetVar, varsDb);
        const expectedVal = S[targetVar];

        const parentIndices = inputVars.map(v => producedBy[v]).filter(idx => idx !== undefined);
        const ancestorSet = new Set();
        function traceAncestors(pIdx) {
          ancestorSet.add(pIdx);
          const pStep = steps[pIdx];
          if (pStep && pStep.parentIndices) {
            pStep.parentIndices.forEach(gpIdx => traceAncestors(gpIdx));
          }
        }
        parentIndices.forEach(pIdx => traceAncestors(pIdx));

        const stepIdx = steps.length;
        steps.push({
          stepIdx,
          type: "single",
          targetVar,
          eqId: eq.id,
          eqName: eq.name,
          baseFormula,
          canonicalTex,
          requiredUnits,
          equationTex: isolated.texEquation,
          rhsExpr: isolated.isolatedRhs,
          expectedVal,
          nodes: eqNodes,
          parentIndices,
          ancestorIndices: Array.from(ancestorSet),
          isFaded: false
        });

        producedBy[targetVar] = stepIdx;
        known.add(targetVar);
        usedEquations.add(eq.id);
        keepPropagating = true;
        break;
      }
    }
  }

  return steps;
}

export function canSolveTarget(givensArray, targetVar, relations = []) {
  const steps = solveDAG(givensArray, {}, relations, {}, () => 0);
  return steps.some(s => s.targetVar === targetVar);
}

/**
 * Prunes solution steps to the goal and activates Golden Ratio cognitive fading.
 */
export function pruneSolutionPath(steps = [], goalVar, getMastery = () => 0) {
  const goalIdx = steps.findIndex(s => s.targetVar === goalVar);
  if (goalIdx < 0) return [];

  const requiredIndices = new Set([goalIdx, ...(steps[goalIdx].ancestorIndices || [])]);
  const solution = steps.filter(s => requiredIndices.has(s.stepIdx));

  // Activate Fading on intermediate steps when mastery exceeds FADING_THRESHOLD (76.4%)
  const fadedAncestorEqIds = [];
  solution.forEach(step => {
    const isGoal = step.targetVar === goalVar;
    const mastery = getMastery(step);

    if (!isGoal && mastery >= FADING_THRESHOLD) {
      step.isFaded = true;
      fadedAncestorEqIds.push(step.eqId);
    } else {
      step.isFaded = false;
    }
    step.fadedAncestorEqIds = [...fadedAncestorEqIds];
  });

  return solution;
}
