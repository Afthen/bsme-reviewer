/**
 * src/cas/units.js
 * ============================================================================
 * ARCHITECTURAL PILLARS:
 * - PILLAR II: The Universal Scale Law & Atomic Unit Bags
 * - PILLAR V: The Option B Empirical Contract
 * ============================================================================
 * PHILOSOPHY:
 * 1. Universal Scale Law:
 *    Zero hardcoding of conversion numbers (like 1/12, 1/60000, 25.4).
 *    Every expression has an intrinsic scale to SI base units:
 *      exprScale = factor * \prod (scale_a)^power_a
 *    Target unit has scale targetScale.
 *    The universal conversion factor between raw numbers and target unit is:
 *      numericConversionFactor = exprScale / targetScale
 *
 * 2. Visual Cancellation vs. Numerical Scaling:
 *    When two units of the same dimension cancel (e.g., m / mm or min / s),
 *    they cancel visually in KaTeX (\cancel{...}), but their physical scale
 *    ratio (1000 or 60) MUST remain in exprScale so numerical values evaluate
 *    with 100% ground-truth accuracy.
 *
 * 3. Empirical Option B Contract:
 *    Empirical formulas (e.g. Buckingham dynamic load) have coefficients
 *    tied to specific units. Variables are pre-conditioned to requiredUnits
 *    before numerical evaluation.
 * ============================================================================
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
      const b = ATOMIC_BASE_UNITS[aName];
      if (b) {
        dimMap[b.dim] = (dimMap[b.dim] || 0) + p;
        scale *= Math.pow(b.scale, p);
      }
    }
    return { factor, atoms, dimMap, scale, isDimensionless: false, displayTex: c.displayTex };
  }

  if (ATOMIC_BASE_UNITS[uName]) {
    const b = ATOMIC_BASE_UNITS[uName];
    return {
      factor: 1.0,
      atoms: { [uName]: 1 },
      dimMap: { [b.dim]: 1 },
      scale: b.scale,
      isDimensionless: false,
      displayTex: b.tex
    };
  }

  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const all = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of all) {
    if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  }
  return true;
}

// ========================================================
// 2. ATOMIC DIMENSIONAL ANALYSIS
// ========================================================

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
        token: node.name,
        canonicalKey: cKey,
        unitName: uName,
        atom: aName,
        dim: b?.dim || "custom",
        scale: b?.scale || 1.0,
        power: p,
        tex: b?.tex || `\\text{${aName}}`
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
          token: node.fn,
          canonicalKey: node.fn,
          unitName: "rad",
          atom: "rad",
          dim: "C",
          scale: 1.0,
          power: 1,
          tex: "\\text{rad}"
        }]
      };
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
      const invR = right.atoms.map(a => ({ ...a, power: -a.power }));
      return { factor: left.factor / right.factor, atoms: [...left.atoms, ...invR] };
    }
    if (node.op === "+" || node.op === "-") {
      return left;
    }
  }

  return { factor: 1.0, atoms: [] };
}

/**
 * Derives visual cancellation markup (KaTeX) and the true numeric conversion factor.
 */
export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = (typeof exprOrAST === "string") ? parseMathAST(exprOrAST) : exprOrAST;
  const selectedConversions = [];
  const preConversions = [];

  // Branch A: Option B Empirical Contract Pre-Conditioning
  if (requiredUnits && typeof requiredUnits === "object") {
    const varTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
    varTokens.forEach(tok => {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[cKey] || requiredUnits[tok];
      if (!reqU) return;

      const currU = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
      if (currU && reqU && currU !== reqU && currU !== "deg" && reqU !== "°") {
        const currBag = getUnitAtomBag(currU);
        const reqBag = getUnitAtomBag(reqU);

        if (isDimEqual(currBag.dimMap, reqBag.dimMap)) {
          const ratio = currBag.scale / reqBag.scale;
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          preConversions.push({
            token: tok,
            canonicalKey: cKey,
            fromUnit: currU,
            toUnit: reqU,
            conv: {
              factor: ratio,
              latex: `\\frac{1\\text{ ${reqU}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${currU}}}}`
            },
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

  // Branch B: Pure Physical Unit Analysis
  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetBag = getUnitAtomBag(targetUnit);

  // 1. The Universal Scale Law: product of ALL atomic input scales
  let exprScale = exprAnalysis.factor;
  exprAnalysis.atoms.forEach(a => {
    exprScale *= Math.pow(a.scale, a.power);
  });

  let targetScale = targetBag.scale || 1.0;
  const numericConversionFactor = targetScale > 0 ? (exprScale / targetScale) : 1.0;

  // 2. KaTeX Visual Cancellation Formatting (For Student Solution View)
  const targetWantsTeeth = (targetBag.atoms["teeth"] || 0) > 0;
  const atomList = exprAnalysis.atoms.map((a, idx) => ({ ...a, id: idx, canceled: false, preserved: false }));

  for (let i = 0; i < atomList.length; i++) {
    for (let j = i + 1; j < atomList.length; j++) {
      const a1 = atomList[i], a2 = atomList[j];
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

  const remaining = atomList.filter(a => !a.canceled && !a.preserved);
  const dimsPresent = Array.from(new Set(remaining.map(a => a.dim)));

  dimsPresent.forEach(dim => {
    const dimAtoms = remaining.filter(a => a.dim === dim);
    const pos = dimAtoms.find(a => a.power > 0);
    const neg = dimAtoms.find(a => a.power < 0);

    if (pos && neg && pos.atom !== neg.atom) {
      const ratio = pos.scale / neg.scale;
      selectedConversions.push({
        latex: ratio < 1
          ? `\\frac{1\\,\\cancel{\\text{${neg.atom}}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${pos.atom}}}}`
          : `\\frac{${ratio.toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${neg.atom}}}}{1\\,\\cancel{\\text{${pos.atom}}}}`
      });
      pos.canceled = true;
      neg.canceled = true;
    }
  });

  if (Math.abs(numericConversionFactor - 1.0) > 1e-4) {
    atomList.filter(a => !a.canceled && !a.preserved).forEach(a => {
      for (const [tAtom, tPower] of Object.entries(targetBag.atoms)) {
        const tBase = ATOMIC_BASE_UNITS[tAtom];
        if (tBase && tBase.dim === a.dim && Math.abs(tPower - a.power) < 1e-4 && a.atom !== tAtom) {
          selectedConversions.push({
            latex: a.power < 0
              ? (tBase.scale / a.scale > 1
                  ? `\\frac{${(tBase.scale / a.scale).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}{1\\text{ ${tAtom}}}`
                  : `\\frac{1\\,\\cancel{\\text{${a.atom}}}}{${(a.scale / tBase.scale).toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}`)
              : (a.scale / tBase.scale > 1
                  ? `\\frac{${(a.scale / tBase.scale).toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}{1\\,\\cancel{\\text{${a.atom}}}}`
                  : `\\frac{1\\text{ ${tAtom}}}{${(tBase.scale / a.scale).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}`)
          });
          a.canceled = true;
        }
      }
    });
  }

  const tokenMarkup = {}, tokenGroups = {};
  atomList.forEach(a => {
    (tokenGroups[a.token] = tokenGroups[a.token] || []).push(a);
  });

  for (const [tok, atoms] of Object.entries(tokenGroups)) {
    const uName = atoms[0]?.unitName;
    const compound = COMPOUND_UNITS[uName];
    if (!compound) {
      tokenMarkup[tok] = atoms[0]?.canceled ? `\\cancel{${atoms[0]?.tex}}` : atoms[0]?.tex;
      continue;
    }
    const numStr = atoms.filter(a => a.power > 0).map(a => a.canceled ? `\\cancel{${a.tex}}` : a.tex).join("\\cdot");
    const denStr = atoms.filter(a => a.power < 0).map(a => a.canceled ? `\\cancel{${a.tex}}` : a.tex).join("\\cdot");
    const prefix = compound.factor && compound.factor !== 1 ? `${compound.factor}\\,` : "";
    tokenMarkup[tok] = denStr ? `\\frac{${prefix}${numStr || "1"}}{${denStr}}` : `${prefix}${numStr}`;
  }

  return {
    tokenMarkup,
    conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    numericConversionFactor,
    preConversions
  };
}

/**
 * Universal Angle Checker: Checks if an AST node evaluates to degrees.
 */
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

/**
 * Single Source of Truth for Physical Evaluation.
 */
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
