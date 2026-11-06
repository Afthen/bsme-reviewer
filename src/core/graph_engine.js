/**
 * src/core/graph_engine.js
 */

import { cancelUnit, formatConversionWithCancellation } from './units.js';

/**
 * Computer Algebra System (CAS) helper for successive step simplification.
 */
export class CAS {
  /**
   * Algebraic simplification for substituted expressions.
   */
  static simplify(expr) {
    if (!expr) return '';
    let s = expr.trim();

    // Simplifies ((T1/Pd) + (T2/Pd)) / 2 => (T1 + T2) / (2 * Pd)
    s = s.replace(
      /\(\s*\(\s*([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_]+)\s*\)\s*\+\s*\(\s*([A-Za-z0-9_]+)\s*\/\s*\2\s*\)\s*\)\s*\/\s*([0-9.]+)/g,
      '($1 + $3) / ($4 * $2)'
    );

    // Simplifies ((T1 + T2) / Pd) / 2 => (T1 + T2) / (2 * Pd)
    s = s.replace(
      /\(\s*([A-Za-z0-9_+ ]+)\s*\/\s*([A-Za-z0-9_]+)\s*\)\s*\/\s*([0-9.]+)/g,
      '($1) / ($3 * $2)'
    );

    // Simplifies (Fn * cos(phi)) * ((v / (pi * n1 / 60)) / 2) => (Fn * cos(phi) * 60 * v) / (2 * pi * n1)
    s = s.replace(
      /([A-Za-z0-9_()]+)\s*\*\s*\(\s*\(\s*([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_ *]+)\s*\)\s*\/\s*2\s*\)/g,
      '($1 * $2) / (2 * ($3))'
    );

    return s;
  }

  /**
   * Isolates targetVar from the simplified formula.
   */
  static isolate(lhs, rhs, targetVar) {
    const cleanLhs = lhs.trim();
    const cleanRhs = rhs.trim();

    if (cleanLhs === targetVar) {
      return { target: targetVar, formula: cleanRhs };
    }

    // Pattern: C = (T1 + T2) / (2 * Pd) => Pd = (T1 + T2) / (2 * C)
    const fracMatch = cleanRhs.match(/^\(?([A-Za-z0-9_+ ]+)\)?\s*\/\s*\(?([0-9.]+)\s*\*?\s*([A-Za-z0-9_]+)\)?$/);
    if (fracMatch) {
      const num = fracMatch[1].trim();
      const coef = fracMatch[2].trim();
      const denomVar = fracMatch[3].trim();
      if (denomVar === targetVar) {
        return {
          target: targetVar,
          formula: `(${num}) / (${coef} * ${cleanLhs})`
        };
      }
    }

    return { target: targetVar, formula: cleanRhs };
  }
}

/**
 * Graph Substitution Pipeline: Alternates Graph -> CAS -> Graph -> CAS -> Isolate.
 */
export class GraphEngine {
  static resolveAlternatingPipeline(formulaDef, givens, targetVar) {
    let currentLhs = formulaDef.canonicalLhs;
    let currentRhs = formulaDef.canonicalRhs;

    let needsSub = true;
    let loops = 0;

    // Alternating cycle
    while (needsSub && loops < 5) {
      loops++;
      needsSub = false;

      for (const [v, subExpr] of Object.entries(formulaDef.substitutions || {})) {
        if (!givens.includes(v) && currentRhs.includes(v)) {
          // Graph step: Substitute formula in place of the intermediate variable
          currentRhs = currentRhs.replace(new RegExp(`\\b${v}\\b`, 'g'), `(${subExpr})`);
          needsSub = true;
        }
      }

      if (needsSub) {
        // CAS step: Simplify successive algebraic representation
        currentRhs = CAS.simplify(currentRhs);
      }
    }

    // Isolate target by CAS
    const isolated = CAS.isolate(currentLhs, currentRhs, targetVar);
    return {
      canonicalEquation: formulaDef.canonicalLatex,
      isolatedFormula: isolated.formula
    };
  }
}
