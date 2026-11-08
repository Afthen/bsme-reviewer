/**
 * src/core/units.js
 * Physics & Dimensional Analysis Engine.
 * Atomic unit bags, dimensional cancellation, and the single-source physical evaluator.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "./ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "./algebra.js";

// ========================================================
// 1. ATOMIC BASE & COMPOUND UNIT REGISTRY
// ========================================================

export const BASE_DIMENSIONS = Object.freeze({
  L: "Length",
  T: "Time",
  F: "Force",
  M: "Mass",
  Th: "Temperature",
  C: "Count"
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
  deg:  { dim: "C", scale: Math.PI / 180, tex: "°" }
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

  kWh:        { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" },
  "kg/kWh":   { factor: 1 / 3.6e6, atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{kWh}}" },
  "g/kWh":    { factor: 0.001 / 3.6e6, atoms: { g: 1, N: -1, m: -1 }, displayTex: "\\frac{\\text{g}}{\\text{kWh}}" },

  "m/s":      { atoms: { m: 1, s: -1 }, displayTex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { atoms: { ft: 1, min: -1 }, displayTex: "\\frac{\\text{ft}}{\\text{min}}" },

  "teeth/in": { atoms: { teeth: 1, in: -1 }, displayTex: "\\frac{\\text{teeth}}{\\text{in}}" },
  rpm:        { atoms: { min: -1 }, displayTex: "\\text{rpm}" },
  "rev/min":  { atoms: { rev: 1, min: -1 }, displayTex: "\\frac{\\text{rev}}{\\text{min}}" },

  "kg/s":     { atoms: { kg: 1, s: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{s}}" },
  "kg/h":     { atoms: { kg: 1, h: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{h}}" },
  "kJ/kg":    { factor: 1000, atoms: { N: 1, m: 1, kg: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}}" },
  "kJ/(kg*K)":{ factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "kJ/kg-K":  { factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },

  "m^3":      { atoms: { m: 3 }, displayTex: "\\text{m}^3" },
  L:          { factor: 0.001, atoms: { m: 3 }, displayTex: "\\text{L}" },
  "m^3/s":    { atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{m}^3}{\\text{s}}" },
  "m^3/h":    { factor: 1 / 3600, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{m}^3}{\\text{h}}" },
  "L/s":      { factor: 0.001, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{L}}{\\text{s}}" },
  "L/h":      { factor: 0.001 / 3600, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{L}}{\\text{h}}" }
});

export function getUnitAtomBag(uName) {
  if (!uName || uName === "dimless" || uName === "ratio" || uName === "%") {
    return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: true };
  }

  if (COMPOUND_UNITS[uName]) {
    const c = COMPOUND_UNITS[uName];
    const factor = c.factor || 1.0;
    const atoms = { ...c.atoms };
    let scale = factor;
    const dimMap = {};

    for (const [aName, p] of Object.entries(atoms)) {
      const base = ATOMIC_BASE_UNITS[aName];
      if (base) {
        dimMap[base.dim] = (dimMap[base.dim] || 0) + p;
        scale *= Math.pow(base.scale, p);
      }
    }
    return { factor, atoms, dimMap, scale, isDimensionless: false, displayTex: c.displayTex };
  }

  if (ATOMIC_BASE_UNITS[uName]) {
    const base = ATOMIC_BASE_UNITS[uName];
    return {
      factor: 1.0,
      atoms: { [uName]: 1 },
      dimMap: { [base.dim]: 1 },
      scale: base.scale,
      isDimensionless: false,
      displayTex: base.tex
    };
  }

  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const allDims = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of allDims) {
    if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  }
  return true;
}

// ========================================================
// 2. ATOMIC UNIT ANALYSIS & CONVERSION FACTORS
// ========================================================

function evalExprUnitAST(node, S, varsDb) {
  if (!node) return { factor: 1.0, atoms: [] };
  if (node.type === "num") return { factor: 1.0, atoms: [] };

  if (node.type === "id") {
    const canonicalKey = resolveCanonicalKey(node.name, varsDb);
    const uName = S._u?.[canonicalKey] || S._u?.[node.name] || varsDb[canonicalKey]?.unit || varsDb[node.name]?.unit || "dimless";
    const bag = getUnitAtomBag(uName);

    const atoms = [];
    for (const [aName, p] of Object.entries(bag.atoms)) {
      const base = ATOMIC_BASE_UNITS[aName];
      atoms.push({
        token: node.name,
        canonicalKey,
        unitName: uName,
        atom: aName,
        dim: base?.dim || "custom",
        scale: base?.scale || 1.0,
        power: p,
        tex: base?.tex || `\\text{${aName}}`
      });
    }
    return { factor: bag.factor, atoms };
  }

  if (node.type === "group") return evalExprUnitAST(node.expr, S, varsDb);

  if (node.type === "call") {
    if (["sin", "cos", "tan", "atan", "acos", "asin"].includes(node.fn)) {
      return { factor: 1.0, atoms: [] };
    }
    if (node.fn === "sqrt") {
      const inner = evalExprUnitAST(node.arg, S, varsDb);
      return {
        factor: Math.sqrt(inner.factor),
        atoms: inner.atoms.map(a => ({ ...a, power: a.power / 2 }))
      };
    }
    return evalExprUnitAST(node.arg, S, varsDb);
  }

  if (node.type === "binary") {
    const left = evalExprUnitAST(node.left, S, varsDb);
    const right = evalExprUnitAST(node.right, S, varsDb);

    if (node.op === "*") {
      return { factor: left.factor * right.factor, atoms: [...left.atoms, ...right.atoms] };
    }
    if (node.op === "/") {
      const invRightAtoms = right.atoms.map(a => ({ ...a, power: -a.power }));
      return { factor: left.factor / right.factor, atoms: [...left.atoms, ...invRightAtoms] };
    }
    if (node.op === "+" || node.op === "-") {
      return left;
    }
  }

  return { factor: 1.0, atoms: [] };
}

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = parseMathAST(exprStr);
  const selectedConversions = [];
  const preConversions = [];

  // Branch A: Empirical Equations (Option B Contract)
  if (requiredUnits && typeof requiredUnits === "object") {
    const allTokens = getAstIdentifiers(ast);
    const varTokens = Array.from(new Set(allTokens.filter(t => !isReservedMathToken(t))));

    varTokens.forEach(tok => {
      const canonicalKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[canonicalKey] || requiredUnits[tok];
      if (!reqU) return;

      const currentU = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "";

      if (currentU && reqU && currentU !== reqU && currentU !== "deg" && reqU !== "°") {
        const currentBag = getUnitAtomBag(currentU);
        const reqBag = getUnitAtomBag(reqU);

        if (isDimEqual(currentBag.dimMap, reqBag.dimMap)) {
          const ratio = currentBag.scale / reqBag.scale;
          const conv = {
            factor: ratio,
            latex: `\\frac{1\\text{ ${reqU}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${currentU}}}}`
          };
          const rawVal = S[canonicalKey] !== undefined ? S[canonicalKey] : S[tok];
          preConversions.push({
            token: tok,
            canonicalKey,
            fromUnit: currentU,
            toUnit: reqU,
            conv,
            rawVal,
            convertedVal: rawVal * ratio
          });
        }
      }
    });

    return {
      tokenMarkup: {},
      conversionFactors: [],
      conversionFactorTex: "",
      numericConversionFactor: 1.0,
      preConversions
    };
  }

  // Branch B: Pure Atomic Unit Analysis
  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetBag = getUnitAtomBag(targetUnit);
  const targetWantsTeeth = (targetBag.atoms["teeth"] || 0) > 0;
  const atomList = exprAnalysis.atoms.map((a, idx) => ({ ...a, id: idx, canceled: false, preserved: false }));

  for (let i = 0; i < atomList.length; i++) {
    for (let j = i + 1; j < atomList.length; j++) {
      const a1 = atomList[i];
      const a2 = atomList[j];
      if (a1.atom === a2.atom && a1.power * a2.power < 0 && !a1.canceled && !a2.canceled) {
        a1.canceled = true;
        a2.canceled = true;
      }
    }
  }

  atomList.forEach(a => {
    if (!a.canceled && a.atom === "teeth") {
      if (targetWantsTeeth) a.preserved = true;
      else a.canceled = true;
    }
  });

  const remainingAtoms = atomList.filter(a => !a.canceled && !a.preserved);
  const dimsPresent = Array.from(new Set(remainingAtoms.map(a => a.dim)));

  dimsPresent.forEach(dim => {
    const dimAtoms = remainingAtoms.filter(a => a.dim === dim);
    const pos = dimAtoms.find(a => a.power > 0);
    const neg = dimAtoms.find(a => a.power < 0);

    if (pos && neg && pos.atom !== neg.atom) {
      const ratio = pos.scale / neg.scale;
      let convLatex = "";
      if (ratio < 1) {
        const factor = (1 / ratio).toFixed(4).replace(/\.?0+$/, "");
        convLatex = `\\frac{1\\,\\cancel{\\text{${neg.atom}}}}{${factor}\\,\\cancel{\\text{${pos.atom}}}}`;
      } else {
        const factor = ratio.toFixed(4).replace(/\.?0+$/, "");
        convLatex = `\\frac{${factor}\\,\\cancel{\\text{${neg.atom}}}}{1\\,\\cancel{\\text{${pos.atom}}}}`;
      }
      selectedConversions.push({ latex: convLatex });
      pos.canceled = true;
      neg.canceled = true;
    }
  });

  let netExprScale = exprAnalysis.factor;
  atomList.filter(a => !a.canceled).forEach(a => {
    netExprScale *= Math.pow(a.scale, a.power);
  });

  const numericConversionFactor = targetBag.scale > 0 ? (netExprScale / targetBag.scale) : 1.0;

  if (Math.abs(numericConversionFactor - 1.0) > 1e-4) {
    const uncanceled = atomList.filter(a => !a.canceled && !a.preserved);
    uncanceled.forEach(a => {
      for (const [tAtom, tPower] of Object.entries(targetBag.atoms)) {
        const tBase = ATOMIC_BASE_UNITS[tAtom];
        if (tBase && tBase.dim === a.dim && Math.abs(tPower - a.power) < 1e-4 && a.atom !== tAtom) {
          let convLatex = "";
          if (a.power < 0) {
            const ratio = tBase.scale / a.scale;
            convLatex = ratio > 1
              ? `\\frac{${ratio.toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}{1\\text{ ${tAtom}}}`
              : `\\frac{1\\,\\cancel{\\text{${a.atom}}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}`;
          } else {
            const ratio = a.scale / tBase.scale;
            convLatex = ratio > 1
              ? `\\frac{${ratio.toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}{1\\,\\cancel{\\text{${a.atom}}}}`
              : `\\frac{1\\text{ ${tAtom}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}`;
          }
          selectedConversions.push({ latex: convLatex });
          a.canceled = true;
        }
      }
    });
  }

  const tokenMarkup = {};
  const tokenGroups = {};
  atomList.forEach(a => {
    if (!tokenGroups[a.token]) tokenGroups[a.token] = [];
    tokenGroups[a.token].push(a);
  });

  for (const [tok, atoms] of Object.entries(tokenGroups)) {
    const uName = atoms[0]?.unitName;
    const compound = COMPOUND_UNITS[uName];
    if (!compound) {
      const a = atoms[0];
      tokenMarkup[tok] = a.canceled ? `\\cancel{${a.tex}}` : a.tex;
      continue;
    }
    const numAtoms = atoms.filter(a => a.power > 0);
    const denAtoms = atoms.filter(a => a.power < 0);
    const formatAtom = a => a.canceled ? `\\cancel{${a.tex}}` : a.tex;
    const numStr = numAtoms.map(formatAtom).join("\\cdot");
    const denStr = denAtoms.map(formatAtom).join("\\cdot");
    const prefix = compound.factor && compound.factor !== 1 ? `${compound.factor}\\,` : "";
    tokenMarkup[tok] = denAtoms.length > 0 ? `\\frac{${prefix}${numStr || "1"}}{${denStr}}` : `${prefix}${numStr}`;
  }

  return {
    tokenMarkup,
    conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    numericConversionFactor,
    preConversions
  };
}

// ========================================================
// 3. UNIFIED PHYSICAL EVALUATOR (SINGLE SOURCE OF TRUTH)
// ========================================================

/**
 * Universal Physical Evaluator.
 * Evaluates an AST numerically and applies the exact dimensional conversion factor
 * derived from solveUnitAlgebra. Zero ad-hoc SI loops.
 */
export function evaluatePhysicalAST(node, S, targetVar, varsDb = {}, requiredUnits = null) {
  if (!node) return { value: NaN, unitAnalysis: null };

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || varsDb[canonicalTarget]?.unit || varsDb[targetVar]?.unit || "dimless";
  const exprStr = node.type === "id" ? node.name : undefined; // solveUnitAlgebra can take ast string

  // Use AST directly to run unit algebra
  const allIdentifiers = getAstIdentifiers(node);
  const unitAnalysis = solveUnitAlgebra(
    node.type ? undefined : node,
    S,
    targetVar,
    targetUnit,
    varsDb,
    requiredUnits
  );

  // If empirical with pre-conversions: build patched S
  const evalState = { ...S };
  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      evalState[pc.token] = pc.convertedVal;
      evalState[pc.canonicalKey] = pc.convertedVal;
    });
  }

  // Pure numeric evaluation
  const rawNum = evalAST(node, evalState);
  if (isNaN(rawNum)) return { value: NaN, unitAnalysis };

  // Scale by exact unit conversion factor
  const finalValue = rawNum * (unitAnalysis.numericConversionFactor || 1.0);
  return { value: finalValue, unitAnalysis };
}
