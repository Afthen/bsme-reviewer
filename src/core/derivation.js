/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Textbook-Grade Aligned Derivations
 * - Zero comma separators preceding physical units (uses \\, mathematical spacing)
 * - Additive terms of identical units combined into (a ± b ± ...)\\,unit
 * - Variable symbols consistently drawn from S._displaySymbols
 * - At most one global scale bracket (unitAnalysis.globalConversionTex)
 * ============================================================================
 */

import { parseMathAST } from "../cas/ast.js";
import { resolveCanonicalKey } from "../cas/algebra.js";
import { casToTex, astToLatex } from "../cas/latex.js";
import { solveUnitAlgebra, getUnitAtomBag, isDimEqual, unitToTex } from "../cas/units/index.js";
import { fmtSigFig, formatGivenValue } from "./dimensions.js";

export function buildAlignedDerivation(
  step,
  S = {},
  allSteps = [],
  varsDb = {},
  relations = [],
  answeredVars = new Set(),
  givens = []
) {
  const { targetVar, baseFormula, canonicalTex, rhsExpr, requiredUnits } = step;

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSymbol = S._displaySymbols?.[canonicalTarget] || S._displaySymbols?.[targetVar] || targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";

  const formulaRhs = rhsExpr || (baseFormula && baseFormula.includes("=") ? baseFormula.split("=")[1].trim() : baseFormula) || "";
  const unitAnalysis = solveUnitAlgebra(formulaRhs, S, targetVar, targetUnit, varsDb, requiredUnits);

  const evalState = { ...S };
  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      evalState[pc.token] = pc.convertedVal;
      evalState[pc.canonicalKey] = pc.convertedVal;
    });
  }

  // 1. Build Localized Substitution Mapping with thin LaTeX spacing (no commas)
  const subsMap = {};
  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      const meta = varsDb[k] || {};
      const formattedNum = formatGivenValue(v, meta);
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (unitMarkup !== "" || inlineConv !== "") {
        subsMap[k] = `${formattedNum}\\,${unitMarkup}${inlineConv}`;
      } else {
        subsMap[k] = formattedNum;
      }
    }
  }

  // 2. Additive Unit-Group Factoring: (a ± b ± …) sharing identical physical units
  //    combines into (a ± b)\\,unit with the unit factored outside the parentheses.
  const rhsAst = parseMathAST(formulaRhs);
  const unitOfKey = k => S._u?.[k] || varsDb[k]?.unit || "";

  (function factorAdditiveGroups(node) {
    if (!node) return;
    if (node.type === "group") { factorAdditiveGroups(node.expr); return; }
    if (node.type === "call") { factorAdditiveGroups(node.arg); return; }
    if (node.type !== "binary") return;

    if (node.op === "+" || node.op === "-") {
      const leaves = [];
      (function walk(n, sign) {
        const u = n && n.type === "group" ? n.expr : n;
        if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
          walk(u.left, sign);
          walk(u.right, u.op === "+" ? sign : -sign);
          return;
        }
        if (u && u.type === "id" && typeof evalState[u.name] === "number") {
          leaves.push({ key: u.name, sign });
        }
      })(node, 1);

      const units = leaves.map(l => unitOfKey(l.key));
      const firstBag = getUnitAtomBag(units[0]);
      const allShareUnit = leaves.length > 1 && units.every(u => {
        if (!u && !units[0]) return true;
        if (!u || !units[0]) return false;
        const b = getUnitAtomBag(u);
        return isDimEqual(firstBag.dimMap, b.dimMap) && Math.abs(firstBag.scale - b.scale) < 1e-9;
      });

      if (allShareUnit) {
        const meta0 = varsDb[leaves[0].key] || {};
        const uTex = unitAnalysis.tokenMarkup?.[leaves[0].key] || unitToTex(units[0]);
        const inner = leaves
          .map((l, i) => {
            const signStr = i === 0 ? (l.sign < 0 ? "-" : "") : (l.sign < 0 ? " - " : " + ");
            return `${signStr}${formatGivenValue(evalState[l.key], varsDb[l.key] || meta0)}`;
          })
          .join("");

        subsMap[leaves[0].key] = uTex ? `(${inner})\\,${uTex}` : `(${inner})`;
        leaves.slice(1).forEach(l => { subsMap[l.key] = "0"; });
        return; // maximal group factored cleanly
      }
    }

    factorAdditiveGroups(node.left);
    factorAdditiveGroups(node.right);
  })(rhsAst);

  // 3. Implication Arrow Logic
  const symRhs = casToTex(formulaRhs, varsDb);
  const displayCanonical = canonicalTex || casToTex(baseFormula, varsDb);

  let line1;
  const norm = s => (s || "").replace(/left|right|\s/g, "");
  const isAlreadyIsolated = norm(displayCanonical).startsWith(norm(targetSymbol) + "=");

  // Strip zero-leaves of factored groups and append global conversion factor once
  const numTex = astToLatex(rhsAst, subsMap, varsDb)
    .replace(/[+\-]\s*0(?!\d)/g, "")
    + (unitAnalysis.globalConversionTex || "");

  if (isAlreadyIsolated || !baseFormula) {
    line1 = `${displayCanonical} &= ${numTex}`;
  } else {
    line1 = `${displayCanonical} \\;\\Rightarrow\\; ${targetSymbol} &= ${symRhs} \\\\[6pt]\n  &= ${numTex}`;
  }

  // 4. Final Boxed Answer with clean thin spacing (no comma before unit)
  const val = step.expectedVal !== undefined ? step.expectedVal : S[canonicalTarget];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 6) : val;

  let unitTex = "";
  if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
    if (targetUnit === "deg" || targetUnit === "°") {
      unitTex = "°";
    } else {
      unitTex = `\\,${unitToTex(targetUnit)}`;
    }
  }

  const finalLine = `${targetSymbol} &= \\boxed{${formattedVal}${unitTex}}`;

  return `$$\\begin{aligned}\n  ${line1} \\\\[6pt]\n  ${finalLine}\n\\end{aligned}$$`;
}