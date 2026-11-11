/**
 * src/cas/units/analysis.js
 * Shallowest-Match Unit Cancellation & AST Derivation Markup Engine.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { fmtSigFig } from "../../core/dimensions.js";
import { parseUnitToSemanticAST, semanticASTToTex, SUBSTITUTION_GRAPH, BASE_UNITS } from "./definitions.js";

function expandSemanticFactor(factor) {
  const sub = SUBSTITUTION_GRAPH[factor.base];
  if (!sub) return [factor]; // Leaf node, cannot expand further

  const expanded = [];
  const sign = factor.power > 0 ? 1 : -1;
  const absP = Math.abs(factor.power);

  for (let i = 0; i < absP; i++) {
    sub.num.forEach(b => expanded.push({ prefix: factor.prefix, base: b, power: sign }));
    sub.den.forEach(b => expanded.push({ prefix: factor.prefix, base: b, power: -sign }));
  }
  return expanded;
}

export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = (typeof exprOrAST === "string") ? parseMathAST(exprOrAST) : exprOrAST;
  const tokenMarkup = {};

  if (requiredUnits && typeof requiredUnits === "object") {
    return { tokenMarkup, preConversions: [], numericConversionFactor: 1.0, globalConversionTex: "" };
  }

  // 1. Collect semantic factors for each token in the expression
  const exps = collectTokenExponents(ast);
  const semanticFactors = [];

  for (const [tok, exp] of Object.entries(exps)) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const astFactors = parseUnitToSemanticAST(uName);
    astFactors.forEach(f => {
      semanticFactors.push({ tok, prefix: f.prefix, base: f.base, power: f.power * exp, canceled: false });
    });
  }

  // 2. Pass 1: Exact Match Cancellation
  for (let i = 0; i < semanticFactors.length; i++) {
    for (let j = i + 1; j < semanticFactors.length; j++) {
      const f1 = semanticFactors[i];
      const f2 = semanticFactors[j];
      if (!f1.canceled && !f2.canceled && f1.base === f2.base && f1.prefix === f2.prefix && f1.power * f2.power < 0) {
        f1.canceled = true;
        f2.canceled = true;
        break;
      }
    }
  }

  // 3. Pass 2: Shallowest-Match Substitution Expansion for uncancelled factors
  let expandedList = [...semanticFactors];
  let madeProgress = true;
  let safety = 0;

  while (madeProgress && safety < 5) {
    madeProgress = false;
    safety++;

    const uncancelled = expandedList.filter(f => !f.canceled);
    // Try to expand the first un-cancelled compound factor
    const targetIdx = uncancelled.findIndex(f => SUBSTITUTION_GRAPH[f.base]);
    if (targetIdx !== -1) {
      const itemToExpand = uncancelled[targetIdx];
      // Mark original as canceled/superseded
      itemToExpand.canceled = true;

      const subFactors = expandSemanticFactor(itemToExpand);
      subFactors.forEach(sf => {
        expandedList.push({ tok: itemToExpand.tok, prefix: sf.prefix, base: sf.base, power: sf.power, canceled: false });
      });

      // Re-run exact match cancellation on newly expanded list
      for (let i = 0; i < expandedList.length; i++) {
        for (let j = i + 1; j < expandedList.length; j++) {
          const f1 = expandedList[i];
          const f2 = expandedList[j];
          if (!f1.canceled && !f2.canceled && f1.base === f2.base && f1.prefix === f2.prefix && f1.power * f2.power < 0) {
            f1.canceled = true;
            f2.canceled = true;
            madeProgress = true;
          }
        }
      }
    }
  }

  // 4. Build Token Markup for display
  const allTokens = Array.from(new Set(Object.keys(exps)));
  for (const tok of allTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const originalFactors = parseUnitToSemanticAST(uName);
    const myExpanded = expandedList.filter(f => f.tok === tok);
    const anyCanceled = myExpanded.some(f => f.canceled);

    if (!anyCanceled) {
      tokenMarkup[tok] = semanticASTToTex(originalFactors);
    } else {
      // Render with strikethroughs on cancelled semantic factors
      const activeFactors = originalFactors.map(f => {
        const match = myExpanded.find(ef => ef.base === f.base && ef.prefix === f.prefix);
        const isCanceled = match ? match.canceled : false;
        return { ...f, canceled: isCanceled };
      });
      tokenMarkup[tok] = semanticASTToTexWithCancellation(activeFactors);
    }
  }

  return {
    tokenMarkup,
    conversionFactors: [],
    conversionFactorTex: "",
    numericConversionFactor: 1.0,
    globalConversionTex: ""
  };
}

function semanticASTToTexWithCancellation(factors) {
  const prefixSymbols = { kilo: "k", milli: "m", centi: "c", mega: "M" };
  const numStrs = [];
  const denStrs = [];

  factors.forEach(f => {
    const bSym = BASE_UNITS[f.base]?.symbol || f.base;
    const pSym = f.prefix ? prefixSymbols[f.prefix] || f.prefix : "";
    const fullSym = `${pSym}${bSym}`;

    const absP = Math.abs(f.power);
    const expStr = absP > 1 ? `^{${absP}}` : "";
    const symTex = `\\text{${fullSym}}${expStr}`;
    const termTex = f.canceled ? `\\cancel{${symTex}}` : symTex;

    if (f.power > 0) numStrs.push(termTex);
    else if (f.power < 0) denStrs.push(termTex);
  });

  const nStr = numStrs.join("\\cdot ");
  const dStr = denStrs.join("\\cdot ");
  if (dStr) return `\\cfrac{${nStr || "1"}}{${dStr}}`;
  return nStr;
}

function collectTokenExponents(node, sign = 1, acc = {}) {
  if (!node) return acc;
  if (node.type === "group") return collectTokenExponents(node.expr, sign, acc);
  if (node.type === "id") {
    acc[node.name] = (acc[node.name] || 0) + sign;
    return acc;
  }
  if (node.type === "binary") {
    if (node.op === "*") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, sign, acc);
    } else if (node.op === "/") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, -sign, acc);
    } else if (node.op === "^") {
      const p = typeof evalAST(node.right, {}) === "number" ? evalAST(node.right, {}) : 1;
      collectTokenExponents(node.left, sign * p, acc);
    }
  }
  return acc;
}
