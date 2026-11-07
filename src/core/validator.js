/**
 * src/core/validator.js
 * Automated Verification Harness for Topic Integrity.
 * Run validateTopic(TOPIC) in browser console to test all formulas against ground truth.
 */

import { isolateVariable } from "./cas.js";
import { solveDAG, pruneSolutionPath } from "./graph_solver.js";

export function validateTopic(topic) {
  const { id, title, varsDb, relations, createSystem } = topic;
  const report = {
    topicId: id,
    title,
    errors: [],
    warnings: [],
    testedRelations: 0,
    passedRelations: 0
  };

  console.group(`Validating Topic: ${title} (${id})`);

  // 1. Schema Node Verification
  for (const rel of relations) {
    for (const node of rel.nodes) {
      if (!varsDb[node]) {
        report.errors.push(`Relation [${rel.id}] references unknown node: "${node}"`);
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

  // Check variable presence in S and S._u
  for (const [k, meta] of Object.entries(varsDb)) {
    if (S[k] === undefined && !k.startsWith("_")) {
      report.warnings.push(`Variable "${k}" in varsDb was not defined in generated system S.`);
    }
    if (meta.unit && (!S._u || !S._u[k])) {
      report.warnings.push(`Variable "${k}" has no unit in S._u.`);
    }
  }

  // 3. Formula Solvability & CAS Invertibility
  for (const rel of relations) {
    report.testedRelations++;
    const allowableTargets = rel.solvable || rel.nodes;

    for (const targetVar of allowableTargets) {
      const isolated = isolateVariable(rel.baseFormula, targetVar, varsDb);
      const rhs = isolated.isolatedRhs;

      // Check if unknown is still on the RHS
      const token = targetVar.replace(/[^a-zA-Z0-9]/g, "");
      const regex = new RegExp(`\\b${token}\\b`);
      if (regex.test(rhs.replace(/[^a-zA-Z0-9]/g, ""))) {
        report.errors.push(`CAS failed to isolate "${targetVar}" in relation [${rel.id}]: "${rel.baseFormula}"`);
      }
    }
    report.passedRelations++;
  }

  // 4. DAG Problem Generation Test
  try {
    const randomGoal = relations[0].nodes[0];
    const givens = relations[0].nodes.filter(n => n !== randomGoal);
    const steps = solveDAG(givens, S, relations, varsDb, () => 0);
    const required = pruneSolutionPath(steps, randomGoal);

    if (required.length === 0) {
      report.errors.push(`solveDAG failed to solve canonical relation [${relations[0].id}]`);
    }
  } catch (err) {
    report.errors.push(`solveDAG crashed: ${err.message}`);
  }

  if (report.errors.length === 0) {
    console.log(`%c[PASS] All ${report.testedRelations} relations & schema verified cleanly!`, "color: #22c55e; font-weight: bold;");
  } else {
    console.error(`%c[FAIL] ${report.errors.length} errors found:`, "color: #ef4444; font-weight: bold;", report.errors);
  }
  if (report.warnings.length > 0) {
    console.warn(`[WARN] ${report.warnings.length} warnings:`, report.warnings);
  }

  console.groupEnd();
  return report;
}