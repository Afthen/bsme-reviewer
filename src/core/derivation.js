/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Pure AST-Driven Aligned Derivations
 * - Zero regex; full AST-based subtree mutation and factoring
 * - Additive terms of identical units combined into (a ± b ± ...)\\,unit
 * - Variable symbols consistently drawn from S._displaySymbols
 * - In-situ factor-label unit conversions with "omit 1" rule
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

  // 1. Build Localized Substitution Mapping with explicit `\,` spacing
  const subsMap = {};
  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      const meta = varsDb[k] || {};
      const formattedNum = formatGivenValue(v, meta);
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (inlineConv === "__AFFINE_CONVERTED__") {
        subsMap[k] = unitMarkup;
      } else if (unitMarkup !== "" || inlineConv !== "") {
        subsMap[k] = `${formattedNum} \\, ${unitMarkup}${inlineConv}`;
      } else {
        subsMap[k] = formattedNum;
      }
    }
  }

  // 2. Pure AST Additive Factoring:
  //    Mutates the additive binary subtree directly into a single factored identifier node
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

        const factoredId = `__factored_${leaves.map(l => l.key).join("_")}`;
        const groupConv = unitAnalysis.tokenConversions?.[leaves[0].key]?.join("") || "";
        subsMap[factoredId] = uTex ? `(${inner})\\,${uTex}${groupConv}` : `(${inner})${groupConv}`;

        node.type = "id";
        node.name = factoredId;
        delete node.op;
        delete node.left;
        delete node.right;
        return;
      }
    }

    factorAdditiveGroups(node.left);
    factorAdditiveGroups(node.right);
  })(rhsAst);

  // 3. Implication Arrow Logic
  const symRhs = casToTex(formulaRhs, varsDb);
  const displayCanonical = canonicalTex || casToTex(baseFormula, varsDb);

  const formulaLhs = baseFormula && baseFormula.includes("=")
    ? baseFormula.split("=")[0].trim()
    : "";
  const isAlreadyIsolated = formulaLhs !== "" && (
    formulaLhs === targetVar ||
    resolveCanonicalKey(formulaLhs, varsDb) === canonicalTarget
  );

  const numTex = astToLatex(rhsAst, subsMap, varsDb)
    + (unitAnalysis.globalConversionTex || "");

  let line1;
  if (isAlreadyIsolated || !baseFormula) {
    line1 = `${displayCanonical} &= ${numTex}`;
  } else {
    line1 = `${displayCanonical} \\;\\Rightarrow\\; ${targetSymbol} &= ${symRhs} \\\\[6pt]\n  &= ${numTex}`;
  }

  // 4. Final Boxed Answer with strict `\,` unit spacing
  const val = step.expectedVal !== undefined ? step.expectedVal : S[canonicalTarget];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 6) : val;

  let unitTex = "";
  if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
    if (targetUnit === "deg" || targetUnit === "°") {
      unitTex = "°";
    } else if (targetUnit === "%") {
      unitTex = "\\text{\\%}";
    } else {
      unitTex = unitToTex(targetUnit, true);
    }
  }

  const finalLine = unitTex
    ? (unitTex === "°" ? `${targetSymbol} &= \\boxed{${formattedVal}°}` : `${targetSymbol} &= \\boxed{${formattedVal} \\, ${unitTex}}`)
    : `${targetSymbol} &= \\boxed{${formattedVal}}`;

  return `$$\\begin{aligned}\n  ${line1} \\\\[6pt]\n  ${finalLine}\n\\end{aligned}$$`;
}
