/**
 * src/core/graph_solver.js
 * Universal Bipartite DAG propagation solver, topological dependency tracer, and path pruner.
 */

import { isolateVariable } from "./cas.js";

// ========================================================
// 1. FORWARD DAG PROPAGATION SOLVER
// ========================================================

/**
 * Propagates forward from givensArray through the relation graph.
 * Prioritizes equations with lower mastery to ensure balanced topic density.
 */
export function solveDAG(givensArray, S, relations = [], varsDb = {}, getMastery = () => 0) {
  const known = new Set(givensArray);
  const steps = [];
  const usedEquations = new Set();
  const producedBy = {};
  let keepPropagating = true;

  // Sort relations so that lower mastery equations fire first
  const sortedRelations = [...relations].sort((a, b) => getMastery(a.id) - getMastery(b.id));

  while (keepPropagating) {
    keepPropagating = false;

    for (const eq of sortedRelations) {
      if (usedEquations.has(eq.id)) continue;

      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];
        const inputVars = eq.nodes.filter(n => n !== targetVar);

        const baseFormula = eq.baseFormula || (eq.canonical ? `${eq.canonical.lhs} = ${eq.canonical.rhs}` : "");
        const isolated = isolateVariable(baseFormula, targetVar, varsDb);
        const expectedVal = S[targetVar] !== undefined ? S[targetVar] : S[targetVar.replace(/_/g, "")];

        const parentIndices = inputVars
          .map(v => producedBy[v])
          .filter(idx => idx !== undefined);

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
          targetVar,
          eqId: eq.id,
          eqName: eq.name,
          baseFormula,
          canonicalTex: eq.canonical?.tex || eq.baseFormula || baseFormula,
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
      }
    }
  }

  return steps;
}

// ========================================================
// 2. REACHABILITY CHECK & PATH PRUNING
// ========================================================

export function canSolveTarget(givensArray, targetVar, relations = [], getMastery = () => 0) {
  const known = new Set(givensArray);
  const used = new Set();
  let keepPropagating = true;

  const sortedRelations = [...relations].sort((a, b) => getMastery(a.id) - getMastery(b.id));

  while (keepPropagating) {
    keepPropagating = false;
    for (const eq of sortedRelations) {
      if (used.has(eq.id)) continue;
      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const solved = unknowns[0];
        if (solved === targetVar) return true;
        known.add(solved);
        used.add(eq.id);
        keepPropagating = true;
      }
    }
  }

  return known.has(targetVar);
}

export function pruneSolutionPath(steps = [], goalVar) {
  const goalIdx = steps.findIndex(s => s.targetVar === goalVar);
  if (goalIdx < 0) return [];

  const requiredIndices = new Set([goalIdx, ...steps[goalIdx].ancestorIndices]);
  return steps.filter(s => requiredIndices.has(s.stepIdx));
}
