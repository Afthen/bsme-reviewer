/**
 * src/core/graph_solver.js
 * Formulas-as-Nodes / Variables-as-Edges Solver Engine.
 * Supports directional solvability whitelists (solvable: [...]) to protect empirical equations.
 */

import { isolateVariable } from "./cas.js";
import { fmtSigFig } from "./dimensions.js";

export function solveDAG(givensArray, S, relations = [], varsDb = {}, getMastery = () => 0) {
  const known = new Set(givensArray);
  const steps = [];
  const usedEquations = new Set();
  const producedBy = {};
  let keepPropagating = true;

  const sortedRelations = [...relations].sort((a, b) => getMastery(a.id) - getMastery(b.id));

  while (keepPropagating) {
    keepPropagating = false;

    // 1. Standard Sequential 1-Unknown Formula Propagation
    for (const eq of sortedRelations) {
      if (usedEquations.has(eq.id)) continue;

      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];

        // Check if equation restricts which variables it can be solved for
        if (eq.solvable && !eq.solvable.includes(targetVar)) {
          continue;
        }

        const inputVars = eq.nodes.filter(n => n !== targetVar);
        const baseFormula = eq.baseFormula || (eq.canonical ? `${eq.canonical.lhs} = ${eq.canonical.rhs}` : "");
        const isolated = isolateVariable(baseFormula, targetVar, varsDb);
        const expectedVal = S[targetVar] !== undefined ? S[targetVar] : S[targetVar.replace(/_/g, "")];

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
          canonicalTex: eq.canonicalTex || eq.canonical?.tex || eq.baseFormula || baseFormula,
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

    // 2. Systems of Equations Resolver (Coupled 2x2 Parallel Edges)
    if (!keepPropagating) {
      for (let i = 0; i < sortedRelations.length; i++) {
        const eq1 = sortedRelations[i];
        if (usedEquations.has(eq1.id)) continue;
        const unk1 = eq1.nodes.filter(n => !known.has(n));
        if (unk1.length !== 2) continue;

        for (let j = i + 1; j < sortedRelations.length; j++) {
          const eq2 = sortedRelations[j];
          if (usedEquations.has(eq2.id)) continue;
          const unk2 = eq2.nodes.filter(n => !known.has(n));
          if (unk2.length !== 2) continue;

          const sharedUnknowns = unk1.filter(u => unk2.includes(u));
          if (sharedUnknowns.length === 2 && typeof nerdamer !== "undefined") {
            const [varA, varB] = sharedUnknowns;
            try {
              const solObj = nerdamer.solveEquations([eq1.baseFormula, eq2.baseFormula], [varA, varB]);
              if (solObj && solObj.length > 0) {
                usedEquations.add(eq1.id);
                usedEquations.add(eq2.id);

                [varA, varB].forEach(targetVar => {
                  const expectedVal = S[targetVar];
                  const stepIdx = steps.length;
                  steps.push({
                    stepIdx,
                    type: "system",
                    systemEqIds: [eq1.id, eq2.id],
                    targetVar,
                    eqId: eq1.id,
                    eqName: `${eq1.name} & ${eq2.name} (Simultaneous System)`,
                    canonicalTex: `\\begin{cases} ${eq1.canonicalTex || eq1.baseFormula} \\\\[4pt] ${eq2.canonicalTex || eq2.baseFormula} \\end{cases}`,
                    equationTex: `${targetVar} = ${fmtSigFig(expectedVal, 6)}`,
                    rhsExpr: eq1.baseFormula,
                    expectedVal,
                    nodes: Array.from(new Set([...eq1.nodes, ...eq2.nodes])),
                    parentIndices: [],
                    ancestorIndices: [],
                    isFaded: false
                  });

                  producedBy[targetVar] = stepIdx;
                  known.add(targetVar);
                });

                keepPropagating = true;
                break;
              }
            } catch (err) {}
          }
        }
        if (keepPropagating) break;
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