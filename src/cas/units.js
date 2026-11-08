/**
 * src/cas/units.js
 * ============================================================================
 * ARCHITECTURAL PILLARS:
 * - PILLAR II: The Universal Scale Law & Atomic Unit Bags
 * - PILLAR V: The Option B Empirical Contract & Affine Temperature Conversions
 * ============================================================================
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "./ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "./algebra.js";
import { fmtSigFig } from "../core/dimensions.js";

export const BASE_DIMENSIONS = Object.freeze({
  L: "Length", T: "Time", F: "Force", M: "Mass", Th: "Temperature", C: "Count"
});

export const ATOMIC_BASE_UNITS = Object.freeze({
  m:    { dim: "L", scale: 1.0, tex: "\\text{m}" },
  mm:   { dim: "L", scale: 0.001, tex: "\\text{mm}" },
  cm:   { dim: "L", scale: 0.01, tex: "\\text{cm}" },
  in:   { dim: "L", scale: 0.0254, tex: "\\text{in}" },
  ft:   { dim: "L", scale: 0.3048, tex: "\\text{ft}" },
  s:    { dim: "T", scale: 1.0, tex: "\\text{s}" },
  min:  { dim: "T", scale: 60.0, tex: "\\text{min}" },
  h:    { dim: "T", scale: 3600.0, tex: "\\text{h}" },
  hr:   { dim: "T", scale: 3600.0, tex: "\\text{h}" },
  N:    { dim: "F", scale: 1.0, tex: "\\text{N}" },
  kN:   { dim: "F", scale: 1000.0, tex: "\\text{kN}" },
  lb:   { dim: "F", scale: 4.4482216, tex: "\\text{lb}" },
  kg:   { dim: "M", scale: 1.0, tex: "\\text{kg}" },
  g:    { dim: "M", scale: 0.001, tex: "\\text{g}" },
  lb_m: { dim: "M", scale: 0.45359237, tex: "\\text{lb}_m" },
  K:    { dim: "Th", scale: 1.0, tex: "\\text{K}" },
  "°C": { dim: "Th", scale: 1.0, tex: "^\\circ\\text{C}" },
  teeth:{ dim: "C", scale: 1.0, tex: "\\text{teeth}" },
  rad:  { dim: "C", scale: 1.0, tex: "\\text{rad}" },
  rev:  { dim: "C", scale: 1.0, tex: "\\text{rev}" },
  "°":  { dim: "C", scale: Math.PI / 180, tex: "°" },
  deg:  { dim: "C", scale: Math.PI / 180, tex: "°" },
  "%":  { dim: "C", scale: 0.01, tex: "\\%" } // Paper-and-calculator percentage scaling
});

export const COMPOUND_UNITS = Object.freeze({
  psi:        { atoms: { lb: 1, in: -2 }, displayTex: "\\text{psi}" },
  MPa:        { atoms: { N: 1, mm: -2 }, displayTex: "\\text{MPa}" },
  Pa:         { atoms: { N: 1, m: -2 }, displayTex: "\\text{Pa}" },
  kPa:        { factor: 1000, atoms: { N: 1, m: -2 }, displayTex: "\\text{kPa}" },
  bar:        { factor: 100000, atoms: { N: 1, m: -2 }, displayTex: "\\text{bar}" },
  "N-m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "N*m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { atoms: { lb: 1, in: 1 }, displayTex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { atoms: { lb: 1, ft: 1 }, displayTex: "\\text{lb}\\cdot\\text{ft}" },
  J:          { atoms: { N: 1, m: 1 }, displayTex: "\\text{J}" },
  kJ:         { factor: 1000, atoms: { N: 1, m: 1 }, displayTex: "\\text{kJ}" },
  W:          { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{W}" },
  kW:         { factor: 1000, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{kW}" },
  MW:         { factor: 1e6, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{MW}" },
  hp:         { factor: 33000, atoms: { ft: 1, lb: 1, min: -1 }, displayTex: "\\text{hp}" },

  // Area:
  "m^2":      { atoms: { m: 2 }, displayTex: "\\text{m}^2" },
  "mm^2":     { atoms: { mm: 2 }, displayTex: "\\text{mm}^2" },
  "in^2":     { atoms: { in: 2 }, displayTex: "\\text{in}^2" },
  "cm^2":     { atoms: { cm: 2 }, displayTex: "\\text{cm}^2" },
  "ft^2":     { atoms: { ft: 2 }, displayTex: "\\text{ft}^2" },

  // Volume:
  "m^3":      { atoms: { m: 3 }, displayTex: "\\text{m}^3" },
  "cm^3":     { atoms: { cm: 3 }, displayTex: "\\text{cm}^3" },
  "in^3":     { atoms: { in: 3 }, displayTex: "\\text{in}^3" },
  "ft^3":     { atoms: { ft: 3 }, displayTex: "\\text{ft}^3" },
  L:          { factor: 0.001, atoms: { m: 3 }, displayTex: "\\text{L}" },

  // Density:
  "kg/m^3":   { atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{kg}}{\\text{m}^3}" },
  "kg/L":     { factor: 1000, atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{kg}}{\\text{L}}" },
  "g/cm^3":   { factor: 1000, atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{g}}{\\text{cm}^3}" },
  "lb/ft^3":  { atoms: { lb_m: 1, ft: -3 }, displayTex: "\\cfrac{\\text{lb}}{\\text{ft}^3}" },

  // Enthalpy / Heating Value:
  "kJ/kg":    { factor: 1000, atoms: { N: 1, m: 1, kg: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}}" },
  "Btu/lb":   { factor: 2326, atoms: { N: 1, m: 1, kg: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{lb}}" },

  // Fuel Consumption:
  kWh:        { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" },
  "kg/kWh":   { factor: 1 / 3.6e6, atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{kWh}}" },
  "g/kWh":    { factor: 0.001 / 3.6e6, atoms: { g: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{g}}{\\text{kWh}}" },
  "lb/hp-h":  { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },
  "lb/hp-hr": { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },

  // Speed:
  "m/s":      { atoms: { m: 1, s: -1 }, displayTex: "\\cfrac{\\text{m}}{\\text{s}}" },
  "ft/min":   { atoms: { ft: 1, min: -1 }, displayTex: "\\cfrac{\\text{ft}}{\\text{min}}" },
  "teeth/in": { atoms: { teeth: 1, in: -1 }, displayTex: "\\cfrac{\\text{teeth}}{\\text{in}}" },
  rpm:        { atoms: { min: -1 }, displayTex: "\\text{rpm}" },
  "rev/s":    { atoms: { s: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{s}}" },
  "rev/min":  { atoms: { min: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{min}}" },
  "strokes/min": { atoms: { min: -1 }, displayTex: "\\text{strokes/min}" },

  "kJ/(kg*K)":{ factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "kJ/kg-K":  { factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" }
});

export function getUnitAtomBag(uName) {
  if (!uName || uName === "dimless" || uName === "ratio") {
    return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: true };
  }
  if (uName === "%") {
    return { factor: 1.0, atoms: { "%": 1 }, dimMap: { C: 1 }, scale: 0.01, isDimensionless: false, displayTex: "\\%" };
  }
  if (COMPOUND_UNITS[uName]) {
    const c = COMPOUND_UNITS[uName];
    const factor = c.factor || 1.0;
    const atoms = { ...c.atoms };
    let scale = factor;
    const dimMap = {};
    for (const [aName, p] of Object.entries(atoms)) {
      const b = ATOMIC_BASE_UNITS[aName];
      if (b) { dimMap[b.dim] = (dimMap[b.dim] || 0) + p; scale *= Math.pow(b.scale, p); }
    }
    return { factor, atoms, dimMap, scale, isDimensionless: false, displayTex: c.displayTex };
  }
  if (ATOMIC_BASE_UNITS[uName]) {
    const b = ATOMIC_BASE_UNITS[uName];
    return { factor: 1.0, atoms: { [uName]: 1 }, dimMap: { [b.dim]: 1 }, scale: b.scale, isDimensionless: false, displayTex: b.tex };
  }
  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const all = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of all) if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  return true;
}

function evalExprUnitAST(node, S, varsDb) {
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
    if (["sin", "cos", "tan"].includes(node.fn)) {
      return { factor: 1.0, atoms: [] };
    }
    if (["atan", "acos", "asin"].includes(node.fn)) {
      return {
        factor: 1.0,
        atoms: [{
          token: node.fn, canonicalKey: node.fn, unitName: "rad", atom: "rad",
          dim: "C", scale: 1.0, power: 1, tex: "\\text{rad}"
        }]
      };
    }
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
    if (node.op === "/") {
      const invR = right.atoms.map(a => ({ ...a, power: -a.power }));
      return { factor: left.factor / right.factor, atoms: [...left.atoms, ...invR] };
    }
    if (node.op === "+" || node.op === "-") return left;
    if (node.op === "^") {
      const evaluatedExp = evalAST(node.right, {});
      const powerNum = typeof evaluatedExp === "number" && !isNaN(evaluatedExp) ? evaluatedExp : 1;
      return {
        factor: Math.pow(left.factor, powerNum),
        atoms: left.atoms.map(a => ({ ...a, power: a.power * powerNum }))
      };
    }
  }
  return { factor: 1.0, atoms: [] };
}

export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = (typeof exprOrAST === "string") ? parseMathAST(exprOrAST) : exprOrAST;
  const selectedConversions = [];
  const tokenConversions = {};
  const preConversions = [];

  // Branch A: Option B Empirical Pre-Conditioning (Includes Affine Temperature)
  if (requiredUnits && typeof requiredUnits === "object") {
    const varTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
    varTokens.forEach(tok => {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[cKey] || requiredUnits[tok];
      if (!reqU) return;
      const currU = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";

      // Affine temperature offset for Kelvin: T_K = T_C + 273.15
      if (currU === "°C" && (reqU === "K" || reqU === "degK")) {
        const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
        const convertedVal = rawVal + 273.15;
        preConversions.push({
          token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
          conv: { factor: 1.0, latex: `(${rawVal} + 273.15)\\text{ K}` },
          rawVal, convertedVal
        });
        return;
      }

      if (currU && reqU && currU !== reqU && currU !== "deg" && reqU !== "°") {
        const currBag = getUnitAtomBag(currU), reqBag = getUnitAtomBag(reqU);
        if (isDimEqual(currBag.dimMap, reqBag.dimMap)) {
          const ratio = currBag.scale / reqBag.scale;
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          preConversions.push({
            token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
            conv: { factor: ratio, latex: `\\cfrac{1\\text{ ${reqU}}}{${fmtSigFig(1/ratio)}\\,\\cancel{\\text{${currU}}}}` },
            rawVal, convertedVal: rawVal * ratio
          });
        }
      }
    });
    return { tokenMarkup: {}, conversionFactors: [], conversionFactorTex: "", numericConversionFactor: 1.0, preConversions, tokenConversions };
  }

  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetBag = getUnitAtomBag(targetUnit);

  let exprScale = exprAnalysis.factor;
  exprAnalysis.atoms.forEach(a => { exprScale *= Math.pow(a.scale, a.power); });

  let targetScale = targetBag.scale || 1.0;
  const numericConversionFactor = targetScale > 0 ? (exprScale / targetScale) : 1.0;

  const targetWantsTeeth = (targetBag.atoms["teeth"] || 0) > 0;
  const atomList = exprAnalysis.atoms.map((a, idx) => ({ ...a, id: idx, canceled: false, preserved: false }));

  for (let i = 0; i < atomList.length; i++) {
    for (let j = i + 1; j < atomList.length; j++) {
      const a1 = atomList[i], a2 = atomList[j];
      if (a1.atom === a2.atom && a1.power * a2.power < 0 && !a1.canceled && !a2.canceled) {
        a1.canceled = true; a2.canceled = true;
      }
    }
  }

  atomList.forEach(a => {
    if (!a.canceled && a.atom === "teeth") {
      if (targetWantsTeeth) a.preserved = true; else a.canceled = true;
    }
  });

  const remaining = atomList.filter(a => !a.canceled && !a.preserved);
  const dimsPresent = Array.from(new Set(remaining.map(a => a.dim)));

  // Inline Internal Dimension Clashes
  dimsPresent.forEach(dim => {
    const dimAtoms = remaining.filter(a => a.dim === dim);
    const pos = dimAtoms.find(a => a.power > 0), neg = dimAtoms.find(a => a.power < 0);
    if (pos && neg && pos.atom !== neg.atom) {
      const ratio = pos.scale / neg.scale;
      let convLatex = "";
      if (ratio < 1) {
        convLatex = `\\cdot \\cfrac{1\\,\\cancel{\\text{${neg.atom}}}}{${fmtSigFig(1/ratio)}\\,\\cancel{\\text{${pos.atom}}}}`;
      } else {
        convLatex = `\\cdot \\cfrac{${fmtSigFig(ratio)}\\,\\cancel{\\text{${pos.atom}}}}{1\\,\\cancel{\\text{${neg.atom}}}}`;
      }
      if (!tokenConversions[pos.token]) tokenConversions[pos.token] = [];
      tokenConversions[pos.token].push(convLatex);
      
      pos.canceled = true; neg.canceled = true;
    }
  });

  // Global Scale Mismatch (Explicit prefix scaling like W -> kW)
  if (Math.abs(numericConversionFactor - 1.0) > 1e-4) {
    let handled = false;
    atomList.filter(a => !a.canceled && !a.preserved).forEach(a => {
      for (const [tAtom, tPower] of Object.entries(targetBag.atoms)) {
        const tBase = ATOMIC_BASE_UNITS[tAtom];
        if (tBase && tBase.dim === a.dim && Math.abs(tPower - a.power) < 1e-4 && a.atom !== tAtom) {
          selectedConversions.push({
            latex: a.power < 0
              ? (tBase.scale / a.scale > 1 ? `\\cfrac{${fmtSigFig(tBase.scale / a.scale)}\\,\\cancel{\\text{${a.atom}}}}{1\\text{ ${tAtom}}}` : `\\cfrac{1\\,\\cancel{\\text{${a.atom}}}}{${fmtSigFig(a.scale / tBase.scale)}\\text{ ${tAtom}}}`)
              : (a.scale / tBase.scale > 1 ? `\\cfrac{${fmtSigFig(a.scale / tBase.scale)}\\text{ ${tAtom}}}{1\\,\\cancel{\\text{${a.atom}}}}` : `\\cfrac{1\\text{ ${tAtom}}}{${fmtSigFig(tBase.scale / a.scale)}\\,\\cancel{\\text{${a.atom}}}}`)
          });
          a.canceled = true;
          handled = true;
        }
      }
    });

    // If dimensions match but prefix factor is missing (e.g. 5000 W -> 5 kW)
    if (!handled && targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
      const invFactor = 1 / numericConversionFactor;
      if (invFactor > 1) {
        selectedConversions.push({
          latex: `\\cfrac{1\\text{ ${targetUnit}}}{${fmtSigFig(invFactor)}}`
        });
      } else if (invFactor < 1) {
        selectedConversions.push({
          latex: `\\cfrac{${fmtSigFig(numericConversionFactor)}\\text{ ${targetUnit}}}{1}`
        });
      }
    }
  }

  // Token Markup Builder: Uses NATIVE unit bag so denominators NEVER invert into in/teeth
  const allExprTokens = Array.from(new Set(getAstIdentifiers(ast)));
  const tokenMarkup = {};

  for (const tok of allExprTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    if (uName === "deg" || uName === "°") {
      tokenMarkup[tok] = `^{\\circ}`;
      continue;
    }
    if (uName === "%") {
      tokenMarkup[tok] = `\\%`;
      continue;
    }

    const bag = getUnitAtomBag(uName);
    const formatAtom = (atomName, p) => {
      const isCanceled = atomList.some(a => a.token === tok && a.atom === atomName && a.canceled);
      const expStr = Math.abs(p) > 1 ? `^{${Math.abs(p)}}` : "";
      return isCanceled ? `\\cancel{\\text{${atomName}}}${expStr}` : `\\text{${atomName}}${expStr}`;
    };

    const numAtoms = [];
    const denAtoms = [];
    for (const [aName, p] of Object.entries(bag.atoms)) {
      if (p > 0) numAtoms.push(formatAtom(aName, p));
      else if (p < 0) denAtoms.push(formatAtom(aName, p));
    }

    const numStr = numAtoms.join("\\cdot");
    const denStr = denAtoms.join("\\cdot");
    const prefix = bag.factor && bag.factor !== 1 ? `${bag.factor}\\,` : "";

    tokenMarkup[tok] = denStr ? `\\cfrac{${prefix}${numStr || "1"}}{${denStr}}` : `${prefix}${numStr}`;
  }

  return {
    tokenMarkup, conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    numericConversionFactor, preConversions, tokenConversions
  };
}

export function isExpressionInDegrees(node, S, varsDb) {
  if (!node) return false;
  if (node.type === "id") {
    const cKey = resolveCanonicalKey(node.name, varsDb);
    const u = S._u?.[cKey] || S._u?.[node.name] || varsDb[cKey]?.unit || varsDb[node.name]?.unit;
    return u === "deg" || u === "°";
  }
  if (node.type === "group") return isExpressionInDegrees(node.expr, S, varsDb);
  return false;
}

export function evaluatePhysicalAST(node, S, targetVar, varsDb = {}, requiredUnits = null) {
  if (!node) return { value: NaN, unitAnalysis: null };
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetUnit = S._u?.[cTarget] || S._u?.[targetVar] || varsDb[cTarget]?.unit || varsDb[targetVar]?.unit || "dimless";

  const unitAnalysis = solveUnitAlgebra(node, S, targetVar, targetUnit, varsDb, requiredUnits);

  const evalState = { ...S };
  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      evalState[pc.token] = pc.convertedVal;
      evalState[pc.canonicalKey] = pc.convertedVal;
    });
  }

  const unitResolver = (argNode) => isExpressionInDegrees(argNode, S, varsDb);
  const rawNum = evalAST(node, evalState, unitResolver);
  if (isNaN(rawNum)) return { value: NaN, unitAnalysis };

  const finalValue = rawNum * (unitAnalysis.numericConversionFactor || 1.0);
  return { value: finalValue, unitAnalysis };
}
