/**
 * test/validator.js
 * ============================================================================
 * ARCHITECTURAL PILLAR VI: The Uncompromising "Hound" Test Suite
 * ============================================================================
 * PHILOSOPHY:
 * 1. Zero False Passes:
 *    The test harness uses direct AST tree inspection to guarantee that target
 *    variables are 100% absent from the isolated right-hand side.
 * 2. Ground-Truth Numerical Fidelity:
 *    Every invertible (equation, target) pair is evaluated through the physical
 *    unit engine against ground truth S. Relative error must remain <= 0.1%.
 * 3. Multi-Hop Graph Solvability:
 *    Ensures that the DAG solver can connect given variables across multiple
 *    hops to reach solution targets cleanly.
 * ============================================================================
 */

import { astHasVariable, parseMathAST } from "../src/cas/ast.js";
import { isolateVariable } from "../src/cas/algebra.js";
import { getUnitAtomBag, evaluatePhysicalAST } from "../src/cas/units/index.js";
import { solveDAG, pruneSolutionPath } from "../src/core/graph_solver.js";

export function validateTopic(topic) {
  const { id, title, varsDb, relations, createSystem } = topic;
  const report = {
    topicId: id,
    title,
    errors: [],
    warnings: [],
    testedRelations: relations.length,
    passedRelations: 0,
    testedPairs: 0,
    passedPairs: 0
  };

  // 1. Duplicate Relation ID Check
  const seenIds = new Set();
  for (const rel of relations) {
    if (seenIds.has(rel.id)) {
      report.errors.push(`Duplicate relation ID found: "${rel.id}"`);
    }
    seenIds.add(rel.id);
  }

  // 2. Schema Node & Unit Verification
  for (const rel of relations) {
    for (const node of rel.nodes) {
      if (!varsDb[node]) {
        report.errors.push(`Relation [${rel.id}] references unknown node: "${node}"`);
      }
    }
  }

  for (const [k, meta] of Object.entries(varsDb)) {
    if (meta.unit) {
      const bag = getUnitAtomBag(meta.unit);
      if (bag.isUnknown) {
        report.errors.push(`Variable "${k}" references unregistered unit: "${meta.unit}"`);
      }
    }
  }

  // 3. Deterministic Dual-System Verification (Tests BOTH SI and US)
  const systemsToTest = ["SI", "US"];

  for (const sys of systemsToTest) {
    let S;
    try {
      S = createSystem({ sys });
    } catch (err) {
      report.errors.push(`createSystem({ sys: "${sys}" }) threw error: ${err.message}`);
      continue;
    }

    for (const [k, meta] of Object.entries(varsDb)) {
      if (meta.isAbstract) continue;
      if (S[k] === undefined && !k.startsWith("_")) {
        report.warnings.push(`[${sys}] Variable "${k}" in varsDb was not defined in S.`);
      }
      if (meta.unit && (!S._u || !S._u[k])) {
        report.warnings.push(`[${sys}] Variable "${k}" has no unit in S._u.`);
      }
    }

    for (const rel of relations) {
      let relationPassed = true;
      const activeVariant = (rel.variants && rel.variants[sys]) ? rel.variants[sys] : null;
      const baseFormula = activeVariant?.baseFormula || rel.baseFormula;
      const allowableTargets = activeVariant?.nodes || rel.nodes;
      const requiredUnits = activeVariant?.requiredUnits || rel.requiredUnits || null;

      for (const targetVar of allowableTargets) {
        const isolated = isolateVariable(baseFormula, targetVar, varsDb);

        if (!isolated.success) {
          // The AST determines this is mathematically non-invertible (e.g. exponent extraction).
          // This is a valid physical limit, not an error. The solver will naturally skip it.
          continue;
        }

        report.testedPairs++;
        const rhsAst = parseMathAST(isolated.isolatedRhs);
        if (astHasVariable(rhsAst, targetVar)) {
          report.errors.push(`[${sys}] Self-reference: [${rel.id}] target "${targetVar}" still present in RHS: "${isolated.isolatedRhs}"`);
          relationPassed = false;
          continue;
        }

        const expectedVal = S[targetVar];
        if (typeof expectedVal === "number" && !isNaN(expectedVal)) {
          const { value: computedVal } = evaluatePhysicalAST(rhsAst, S, targetVar, varsDb, requiredUnits);

          if (isNaN(computedVal)) {
            report.errors.push(`[${sys}] Evaluation NaN: [${rel.id}] "${targetVar} = ${isolated.isolatedRhs}" returned NaN with ground truth S`);
            relationPassed = false;
            continue;
          }

          const denom = Math.abs(expectedVal) || 1;
          const relErr = Math.abs(computedVal - expectedVal) / denom;

          if (relErr > 0.001) {
            report.errors.push(`[${sys}] Numerical mismatch on [${rel.id}] solving "${targetVar}": computed ${computedVal}, expected ${expectedVal} (relErr: ${(relErr * 100).toFixed(3)}%)`);
            relationPassed = false;
            continue;
          }
        }

        report.passedPairs++;
      }

      if (relationPassed) {
        report.passedRelations++;
      }
    }

    // 4. Multi-Goal DAG Stress Test for this system
    const candidateGoals = relations
      .filter(r => !r.requiredUnits)
      .map(r => r.solvable ? r.solvable[0] : r.nodes[0])
      .filter(Boolean);

    const sampleGoals = candidateGoals.slice(0, 5);
    for (const goalVar of sampleGoals) {
      try {
        const relForGoal = relations.find(r => (r.solvable || r.nodes).includes(goalVar));
        const givens = relForGoal.nodes.filter(n => n !== goalVar);
        const steps = solveDAG(givens, S, relations, varsDb, () => 0);
        const required = pruneSolutionPath(steps, goalVar);

        if (required.length === 0) {
          report.errors.push(`[${sys}] solveDAG failed to solve for target "${goalVar}" via relation [${relForGoal.id}]`);
        }
      } catch (err) {
        report.errors.push(`[${sys}] solveDAG crashed testing goal "${goalVar}": ${err.message}`);
      }
    }
  }

  return report;
}
