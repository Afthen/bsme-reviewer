/**
 * src/cas/units/analysis.js
 * Dimensional analysis with CANCEL-FIRST compound handling:
 *   - atomic cancellation runs on every token bag;
 *   - tokens render their cancelled/surviving atoms (expand only what survives);
 *   - scale bridges (kJ->J, %-like silent units excluded) collapse into AT MOST
 *     ONE global conversion bracket, never per-token brackets (kills the
 *     double-counted x1000 class of bugs);
 *   - all TeX goes through unitToTex / atomic tex — raw unit strings never
 *     enter \text{} (kills the red \text{ m^3/kg} class of bugs).
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { fmtSigFig } from "../../core/dimensions.js";
import { ATOMIC_BASE_UNITS, getUnitAtomBag, isDimEqual, unitToTex } from "./definitions.js";

export function evalExprUnitAST(node, S, varsDb) {
  if (!node) return { factor: 1.0, atoms: [] };
  if (node.type === "num") return { factor: 1.0, atoms: [] };
  if (node.type === "id") {
    const cKey = resolveCanonicalKey(node.name, varsDb);
    const uName = S._u?.[cKey] || S._u?.[node.name] || varsDb[cKey]?.unit || varsDb[node.name]?.unit || "dimless";
    const bag = getUnitAtomBag(uName);
    const atoms = [];
    for (const [aName, p] of Object.entries(bag.atoms)) {
      const b = ATOMIC_BASE_UNITS[aName];
      atoms.push({
        token: node.name, canonicalKey: cKey, unitName: uName, atom: aName,
        dim: b?.dim || "custom", scale: b?.scale || 1.0, power: p, tex: b?.tex || `\\text{${aName}}`
      });
    }
    return { factor: bag.factor, atoms };
  }
  if (node.type === "group") return evalExprUnitAST(node.expr, S, varsDb);

  if (node.type === "call") {
    if (["sin", "cos", "tan"].includes(node.fn)) return { factor: 1.0, atoms: [] };
    if (["atan", "acos", "asin"].includes(node.fn)) return { factor: 1.0, atoms: [{ token: node.fn, canonicalKey: node.fn, unitName: "rad", atom: "rad", dim: "C", scale: 1.0, power: 1, tex: "\\text{rad}" }] };
    if (node.fn === "sqrt") {
      const inner = evalExprUnitAST(node.arg, S, varsDb);
      return { factor: Math.sqrt(inner.factor), atoms: inner.atoms.map(a => ({ ...a, power: a.power / 2 })) };
    }
    return evalExprUnitAST(node.arg, S, varsDb);
  }

  if (node.type === "binary") {
    const left = evalExprUnitAST(node.left, S, varsDb);
    const right = evalExprUnitAST(node.right, S, varsDb);
    if (node.op === "*") return { factor: left.factor * right.factor, atoms: [...left.atoms, ...right.atoms] };
    if (node.op === "/") return { factor: left.factor / right.factor, atoms: [...left.atoms, ...right.atoms.map(a => ({ ...a, power: -a.power }))] };
    if (node.op === "+" || node.op === "-") return left;
    if (node.op === "^") {
      const pNum = typeof evalAST(node.right, {}) === "number" ? evalAST(node.right, {}) : 1;
      return { factor: Math.pow(left.factor, pNum), atoms: left.atoms.map(a => ({ ...a, power: a.power * pNum })) };
    }
  }
  return { factor: 1.0, atoms: [] };
}

// Multiplicative exponent of every identifier token (for silent-scale accounting)
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
    // additive subtrees: opaque here (group factoring is derivation's job)
  }
  return acc;
}

export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = (typeof exprOrAST === "string") ? parseMathAST(exprOrAST) : exprOrAST;
  const tokenConversions = {};
  const preConversions = [];
  const tokenMarkup = {};

  if (requiredUnits && typeof requiredUnits === "object") {
    const varTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
    varTokens.forEach(tok => {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[cKey] || requiredUnits[tok];
      if (!reqU) return;
      const currU = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";

      if (currU === "°C" && (reqU === "K" || reqU === "degK")) {
        const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
        preConversions.push({ token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU, conv: { factor: 1.0, latex: `(${rawVal} + 273.15)\\,\\text{K}` }, rawVal, convertedVal: rawVal + 273.15 });
        return;
      }
      if (currU && reqU && currU !== reqU && currU !== "deg" && reqU !== "°") {
        const currBag = getUnitAtomBag(currU), reqBag = getUnitAtomBag(reqU);
        if (isDimEqual(currBag.dimMap, reqBag.dimMap)) {
          const ratio = currBag.scale / reqBag.scale;
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          preConversions.push({ token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU, conv: { factor: ratio, latex: `\\cfrac{${fmtSigFig(ratio)}\\,${unitToTex(reqU)}}{\\cancel{${unitToTex(currU)}}}` }, rawVal, convertedVal: rawVal * ratio });
        }
      }
    });
    return { tokenMarkup, conversionFactors: [], conversionFactorTex: "", numericConversionFactor: 1.0, globalConversionTex: "", preConversions, tokenConversions };
  }

  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetBag = getUnitAtomBag(targetUnit);

  let exprScale = exprAnalysis.factor;
  exprAnalysis.atoms.forEach(a => { exprScale *= Math.pow(a.scale, a.power); });

  const targetScale = targetBag.scale || 1.0;
  const numericConversionFactor = targetScale > 0 ? (exprScale / targetScale) : 1.0;

  // Silent scaled-dimensionless units (%, permille, ...) fold into the numeric
  // factor WITHOUT a printed bracket: "6% * 7000 kW" must read as-is.
  let silentFactor = 1.0;
  const exps = collectTokenExponents(ast);
  for (const [tok, exp] of Object.entries(exps)) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    const bag = getUnitAtomBag(uName);
    if (bag.scaledDimensionless && bag.factor) silentFactor *= Math.pow(bag.factor, exp);
  }
  const bracketFactor = silentFactor !== 0 ? numericConversionFactor / silentFactor : numericConversionFactor;
  const globalConversionTex = (Math.abs(bracketFactor - 1) > 1e-12)
    ? `\\cdot\\left[${fmtSigFig(bracketFactor, 6)}\\right]`
    : "";

  // CANCEL-FIRST: pairwise atomic cancellation over the whole expression
  const atomList = exprAnalysis.atoms.map((a, idx) => ({ ...a, id: idx, canceled: false }));
  for (let i = 0; i < atomList.length; i++) {
    for (let j = i + 1; j < atomList.length; j++) {
      const a1 = atomList[i], a2 = atomList[j];
      if (a1.atom === a2.atom && a1.power * a2.power < 0 && !a1.canceled && !a2.canceled) {
        a1.canceled = true; a2.canceled = true;
      }
    }
  }

  const allExprTokens = Array.from(new Set(getAstIdentifiers(ast)));

  for (const tok of allExprTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    if (uName === "deg" || uName === "°") {
      tokenMarkup[tok] = `°`;
      continue;
    }

    const bag = getUnitAtomBag(uName);

    // Scaled dimensionless: print the value's own symbol (%, no expansion)
    if (bag.scaledDimensionless) {
      tokenMarkup[tok] = bag.displayTex || unitToTex(uName);
      continue;
    }

    if (uName === targetUnit) {
      tokenMarkup[tok] = bag.displayTex || unitToTex(uName);
      continue;
    }

    if (bag.substituteTex) {
      tokenMarkup[tok] = bag.substituteTex;
      continue;
    }

    // Expand ONLY the atoms that survive cancellation; cancelled atoms strike.
    const formatAtom = (atomName, p) => {
      const isCanceled = atomList.some(a => a.token === tok && a.atom === atomName && a.canceled);
      const expStr = Math.abs(p) > 1 ? `^{${Math.abs(p)}}` : "";
      const atomTex = ATOMIC_BASE_UNITS[atomName]?.tex || `\\text{${atomName}}`;
      return isCanceled ? `\\cancel{${atomTex}}${expStr}` : `${atomTex}${expStr}`;
    };

    const numAtoms = [];
    const denAtoms = [];
    for (const [aName, p] of Object.entries(bag.atoms)) {
      if (p > 0) numAtoms.push(formatAtom(aName, p));
      else if (p < 0) denAtoms.push(formatAtom(aName, p));
    }

    const numStr = numAtoms.join("\\cdot ");
    const denStr = denAtoms.join("\\cdot ");
    tokenMarkup[tok] = denStr ? `\\cfrac{${numStr || "1"}}{${denStr}}` : numStr;
  }

  return {
    tokenMarkup,
    conversionFactors: [],
    conversionFactorTex: "",
    numericConversionFactor,
    globalConversionTex,
    preConversions,
    tokenConversions
  };
}
