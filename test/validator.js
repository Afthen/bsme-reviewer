import { astHasVariable, parseMathAST } from "../src/cas/ast.js";
import { isolateVariable } from "../src/cas/algebra.js";
import { getUnitAtomBag, evaluatePhysicalAST } from "../src/cas/units.js";
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

  let S;
  try {
    S = createSystem();
  } catch (err) {
    report.errors.push(`createSystem() threw error: ${err.message}`);
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

  for (const rel of relations) {
    let relationPassed = true;
    const allowableTargets = rel.solvable || rel.nodes;

    for (const targetVar of allowableTargets) {
      report.testedPairs++;
      const activeVariant = (rel.variants && S && S.sys && rel.variants[S.sys]) ? rel.variants[S.sys] : null;
      const baseFormula = activeVariant?.baseFormula || rel.baseFormula;
      const requiredUnits = activeVariant?.requiredUnits || rel.requiredUnits || null;

      const isolated = isolateVariable(baseFormula, targetVar, varsDb);

      if (!isolated.success) {
        report.errors.push(`Inversion failed: [${rel.id}] cannot isolate "${targetVar}" from "${baseFormula}"`);
        relationPassed = false;
        continue;
      }

      const rhsAst = parseMathAST(isolated.isolatedRhs);
      if (astHasVariable(rhsAst, targetVar)) {
        report.errors.push(`Self-reference: [${rel.id}] target "${targetVar}" still present in RHS: "${isolated.isolatedRhs}"`);
        relationPassed = false;
        continue;
      }

      const expectedVal = S[targetVar];
      if (typeof expectedVal === "number" && !isNaN(expectedVal)) {
        const { value: computedVal } = evaluatePhysicalAST(rhsAst, S, targetVar, varsDb, requiredUnits);

        if (isNaN(computedVal)) {
          report.errors.push(`Evaluation NaN: [${rel.id}] "${targetVar} = ${isolated.isolatedRhs}" returned NaN with ground truth S`);
          relationPassed = false;
          continue;
        }

        const denom = Math.abs(expectedVal) || 1;
        const relErr = Math.abs(computedVal - expectedVal) / denom;

        if (relErr > 0.001) {
          report.errors.push(`Numerical mismatch on [${rel.id}] solving "${targetVar}": computed ${computedVal}, expected ${expectedVal} (relErr: ${(relErr * 100).toFixed(3)}%)`);
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
        report.errors.push(`solveDAG failed to solve for target "${goalVar}" via relation [${relForGoal.id}]`);
      }
    } catch (err) {
      report.errors.push(`solveDAG crashed testing goal "${goalVar}": ${err.message}`);
    }
  }

  return report;
}
