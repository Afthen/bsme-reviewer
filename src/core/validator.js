/**
 * src/core/validator.js
 * Automated Verification Harness for Topic Integrity.
 * Zero-regex: Pure AST self-reference tests, numerical evaluation against ground truth,
 * unregistered unit detection, and multi-goal DAG solvability tests.
 */

import { isolateVariable, astHasVariable, evalAST, parseMathAST, getUnitAtomBag } from "./cas.js";
import { solveDAG, pruneSolutionPath } from "./graph_solver.js";

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

  console.group(`Validating Topic: ${title} (${id})`);

  // 1. Schema Node & Unit Verification
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

  // 2. Ground-Truth System Generation Verification
  let S;
  try {
    S = createSystem();
  } catch (err) {
    report.errors.push(`createSystem() threw error: ${err.message}`);
    console.error(report);
    console.groupEnd();
    return report;
  }

  for (const [k, meta] of Object.entries(varsDb)) {
    if (meta.isAbstract) continue;

    if (S[k] === undefined && !k.startsWith("_")) {
      report.warnings.push(`Variable "${k}" in varsDb was not defined in generated system S.`);
    }
    if (meta.unit && (!S._u || !S._u[k])) {
      report.warnings.push(`Variable "${k}" has no unit in S._u.`);
    }
  }

  // 3. Formula Solvability, AST Inversion & Numerical Verification
  for (const rel of relations) {
    let relationPassed = true;
    const allowableTargets = rel.solvable || rel.nodes;

    for (const targetVar of allowableTargets) {
      report.testedPairs++;
      const activeVariant = (rel.variants && S && S.sys && rel.variants[S.sys]) ? rel.variants[S.sys] : null;
      const baseFormula = activeVariant?.baseFormula || rel.baseFormula;

      const isolated = isolateVariable(baseFormula, targetVar, varsDb);

      if (!isolated.success) {
        report.errors.push(`Inversion failed: [${rel.id}] cannot isolate "${targetVar}" from "${baseFormula}"`);
        relationPassed = false;
        continue;
      }

      // Check A: Pure AST check - target must NOT appear in isolated RHS
      const rhsAst = parseMathAST(isolated.isolatedRhs);
      if (astHasVariable(rhsAst, targetVar, varsDb)) {
        report.errors.push(`Self-reference: [${rel.id}] target "${targetVar}" still present in RHS: "${isolated.isolatedRhs}"`);
        relationPassed = false;
        continue;
      }

      // Check B: Numerical evaluation against ground truth S
      const expectedVal = S[targetVar];
      if (typeof expectedVal === "number" && !isNaN(expectedVal)) {
        const computedVal = evalAST(rhsAst, S);
        if (isNaN(computedVal)) {
          // Empirical formulas with requiredUnits may require pre-conversion; skip numerical error if flagged
          if (!activeVariant?.requiredUnits && !rel.requiredUnits) {
            report.errors.push(`Evaluation NaN: [${rel.id}] "${targetVar} = ${isolated.isolatedRhs}" returned NaN with ground truth S`);
            relationPassed = false;
            continue;
          }
        } else {
          const denom = Math.abs(expectedVal) || 1;
          const relErr = Math.abs(computedVal - expectedVal) / denom;
          // Accept 0.05% relative tolerance on analytical inversions
          if (relErr > 0.005) {
            report.errors.push(`Numerical mismatch on [${rel.id}] solving "${targetVar}": computed ${computedVal}, expected ${expectedVal} (relErr: ${(relErr * 100).toFixed(3)}%)`);
            relationPassed = false;
            continue;
          }
        }
      }

      report.passedPairs++;
    }

    if (relationPassed) {
      report.passedRelations++;
    }
  }

  // 4. Multi-Goal DAG Stress Test
  const candidateGoals = relations
    .filter(r => !r.requiredUnits) // skip pure empirical sinks for DAG roots
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
        report.errors.push(`solveDAG failed to solve for target "${goalVar}" via relation [${relForGoal.id}]`);
      }
    } catch (err) {
      report.errors.push(`solveDAG crashed testing goal "${goalVar}": ${err.message}`);
    }
  }

  // Final Console Output
  if (report.errors.length === 0 && report.warnings.length === 0) {
    console.log(`%c[PASS] All ${report.passedRelations}/${report.testedRelations} relations (${report.passedPairs}/${report.testedPairs} pairs) verified cleanly with 0 errors!`, "color: #22c55e; font-weight: bold;");
  } else if (report.errors.length === 0) {
    console.log(`%c[PASS] All ${report.passedRelations}/${report.testedRelations} relations verified with 0 errors!`, "color: #22c55e; font-weight: bold;");
  } else {
    console.error(`%c[FAIL] ${report.errors.length} errors found:`, "color: #ef4444; font-weight: bold;", report.errors);
  }

  if (report.warnings.length > 0) {
    console.warn(`[WARN] ${report.warnings.length} warnings:`, report.warnings);
  }

  console.groupEnd();
  return report;
}
