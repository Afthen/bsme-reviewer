/**
 * src/core/graph_solver.js
 * Formulas-as-Nodes / Variables-as-Edges Solver Engine.
 * Dynamically resolves SI/US variants and requiredUnits contracts.
 */

import { isolateVariable } from "./cas.js";

export function solveDAG(givensArray, S, relations = [], varsDb = {}, getMastery = () => 0) {
  const known = new Set(givensArray);
  const steps = [];
  const usedEquations = new Set();
  const producedBy = {};
  let keepPropagating = true;

  const sortedRelations = [...relations].sort((a, b) => getMastery(a.id) - getMastery(b.id));

  while (keepPropagating) {
    keepPropagating = false;

    // Standard Sequential 1-Unknown Formula Propagation
    for (const eq of sortedRelations) {
      if (usedEquations.has(eq.id)) continue;

      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];

        if (eq.solvable && !eq.solvable.includes(targetVar)) {
          continue;
        }

        const inputVars = eq.nodes.filter(n => n !== targetVar);

        // Resolve system variant (SI vs US) if present
        const activeVariant = (eq.variants && S && S.sys && eq.variants[S.sys]) ? eq.variants[S.sys] : null;
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
          nodes: eq.nodes,
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

export function canSolveTarget(givensArray, targetVar, relations = [], getMastery = () => 0) {
  const steps = solveDAG(givensArray, {}, relations, {}, getMastery);
  return steps.some(s => s.targetVar === targetVar);
}

export function pruneSolutionPath(steps = [], goalVar) {
  const goalIdx = steps.findIndex(s => s.targetVar === goalVar);
  if (goalIdx < 0) return [];

  const requiredIndices = new Set([goalIdx, ...(steps[goalIdx].ancestorIndices || [])]);
  return steps.filter(s => requiredIndices.has(s.stepIdx));
}
