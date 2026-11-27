/**
 * src/cas/units/scales.js
 * Single Source of Truth for canonical unit conversion factors, 6-sig-fig
 * scale formatting (6 s.f., 6-decimal display cap), and factor-label decomposition.
 */

import {
  BASE_UNITS,
  parseUnitToSemanticAST,
  resolveUnitToken,
  getUnitAtomBag,
  isDimEqual,
  unitToTex,
  unitToCancelledTex
} from "./definitions.js";
import { addSeparators, DIMENSIONS } from "../../core/dimensions.js";

import { fmtSigFig, DISPLAY_SIG_FIGS } from "../../core/dimensions.js";

/**
 * Formats scale conversion factors for display through the shared display
 * primitive (6 significant figures, 6-decimal cap). Computation of the
 * scalars themselves stays at 6 s.f. with no decimal cap.
 */
export function fmtScale(n, isLatex = true) {
  if (n === undefined || n === null || isNaN(n)) return "";
  return fmtSigFig(n, DISPLAY_SIG_FIGS, isLatex);
}

// Removes parentheses that wrap an entire side, e.g. "(lb_m*s)" -> "lb_m*s"; leaves "(a)*(b)" intact.
function stripWrappingParens(s) {
  let t = s.trim();
  while (t.startsWith("(") && t.endsWith(")")) {
    let depth = 0;
    let wraps = true;
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i] === "(") depth++;
      else if (t[i] === ")") depth--;
      if (depth === 0) { wraps = false; break; }
    }
    if (!wraps) break;
    t = t.slice(1, -1).trim();
  }
  return t;
}

// Splits "A/B" or "A/(B)" at its single top-level "/". Returns null for anything else
// (no top-level "/", several, unbalanced parentheses, or a "1/(...)" form with no unit numerator).
function splitRateParts(unitStr) {
  if (!unitStr) return null;
  let depth = 0;
  const cuts = [];
  for (let i = 0; i < unitStr.length; i++) {
    const c = unitStr[i];
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth < 0) return null; }
    else if (c === "/" && depth === 0) cuts.push(i);
  }
  if (depth !== 0 || cuts.length !== 1) return null;
  const num = stripWrappingParens(unitStr.slice(0, cuts[0]));
  const den = stripWrappingParens(unitStr.slice(cuts[0] + 1));
  if (!num || !den) return null;
  if (unitStr.includes("(") && num === "1") return null;
  return { num, den };
}

function expandNamedRate(unitStr) {
  if (unitStr === "W") return "J/s";
  if (unitStr === "kW") return "kJ/s";
  return unitStr;
}

/**
 * Formats conversion factor(s) between two units sharing a dimension.
 * Decomposes compound-to-compound rates (e.g. Btu/min -> ft-lb/s) into
 * canonical numerator and denominator steps rather than lumping ratios.
 */
export function formatPairConversion(fromUnit, toUnit, fromDim = null, toDim = fromDim, cancelMode = "whole") {
  const fromScale = getUnitAtomBag(fromUnit, fromDim).scale;
  const toScale = getUnitAtomBag(toUnit, toDim).scale;
  const ratio = fromScale / toScale;

  if (Math.abs(ratio - 1) < 1e-6) return { tex: "", scalar: null, scalars: [], isDecomposed: false };

  // Decompose lumped ratios (e.g. 645.16 -> 25.4^2) to avoid "Alien" factors in tests
  // and to provide textbook-grade derivations.
  const decompose = (val) => {
    if (isCanonicalScaleFactor(val)) return { root: val, power: 1 };
    const r2 = Math.sqrt(Math.abs(val));
    if (isCanonicalScaleFactor(r2)) return { root: Math.sign(val) * r2, power: 2 };
    const r3 = Math.pow(Math.abs(val), 1 / 3);
    if (isCanonicalScaleFactor(r3)) return { root: Math.sign(val) * r3, power: 3 };
    const r4 = Math.pow(Math.abs(val), 1 / 4);
    if (isCanonicalScaleFactor(r4)) return { root: Math.sign(val) * r4, power: 4 };
    return { root: val, power: 1 };
  };

  // Check if decomposing into Num / Den steps yields cleaner canonical factors
  const rawFromParts = splitRateParts(fromUnit);
  const rawToParts = splitRateParts(toUnit);
  const canDecompose = (rawFromParts && rawToParts) ||
    ((rawFromParts || rawToParts) && (fromUnit === "W" || fromUnit === "kW" || toUnit === "W" || toUnit === "kW"));

  if (canDecompose && !(fromUnit === "W" && toUnit === "kW") && !(fromUnit === "kW" && toUnit === "W")) {
    const fParts = splitRateParts(expandNamedRate(fromUnit));
    const tParts = splitRateParts(expandNamedRate(toUnit));

    if (fParts && tParts) {
      const fNumBag = getUnitAtomBag(fParts.num, fromDim);
      const tNumBag = getUnitAtomBag(tParts.num, toDim);
      const fDenBag = getUnitAtomBag(fParts.den, fromDim);
      const tDenBag = getUnitAtomBag(tParts.den, toDim);

      if (isDimEqual(fNumBag.dimMap, tNumBag.dimMap) && isDimEqual(fDenBag.dimMap, tDenBag.dimMap)) {
        const numRatio = fNumBag.scale / tNumBag.scale;
        const denRatio = fDenBag.scale / tDenBag.scale;
        const steps = [];
        const scalars = [];

        if (Math.abs(numRatio - 1) >= 1e-6) {
          const fNTex = unitToCancelledTex(fParts.num, false, fromDim, "whole");
          const tNTex = unitToTex(tParts.num, false, toDim);
          const mag = numRatio > 1 ? numRatio : (1 / numRatio);
          const { root, power } = decompose(mag);
          const texVal = power > 1 ? `(${fmtScale(root)})^${power}` : fmtScale(mag);
          scalars.push(...Array(power).fill(parseFloat(root.toPrecision(6))));
          if (numRatio > 1) {
            steps.push(` \\cdot ${texVal} \\, \\cfrac{${tNTex}}{${fNTex}}`);
          } else {
            steps.push(` \\cdot \\cfrac{${tNTex}}{${texVal} \\, ${fNTex}}`);
          }
        }

        if (Math.abs(denRatio - 1) >= 1e-6) {
          const fDTex = unitToCancelledTex(fParts.den, false, fromDim, "whole");
          const tDTex = unitToTex(tParts.den, false, toDim);
          const mag = denRatio > 1 ? denRatio : (1 / denRatio);
          const { root, power } = decompose(mag);
          const texVal = power > 1 ? `(${fmtScale(root)})^${power}` : fmtScale(mag);
          scalars.push(...Array(power).fill(parseFloat(root.toPrecision(6))));
          if (denRatio > 1) {
            steps.push(` \\cdot \\cfrac{${fDTex}}{${texVal} \\, ${tDTex}}`);
          } else {
            steps.push(` \\cdot ${texVal} \\, \\cfrac{${fDTex}}{${tDTex}}`);
          }
        }

        if (steps.length > 0) {
          const numMismatch = Math.abs(numRatio - 1) >= 1e-6;
          const denMismatch = Math.abs(denRatio - 1) >= 1e-6;
          let cancelledIndices = null;
          if (!rawFromParts) {
            cancelledIndices = new Set([0]);
          } else if (!(numMismatch && denMismatch)) {
            cancelledIndices = new Set();
            parseUnitToSemanticAST(fromUnit, fromDim).forEach((f, idx) => {
              if ((f.power > 0 && numMismatch) || (f.power < 0 && denMismatch)) {
                cancelledIndices.add(idx);
              }
            });
          }
          return { tex: steps.join(""), scalar: scalars[0] ?? null, scalars, isDecomposed: true, cancelledIndices };
        }
      }
    }
  }

  const fromTex = unitToCancelledTex(fromUnit, false, fromDim, cancelMode);
  const toTex = unitToTex(toUnit, false, toDim);

  if (ratio > 1) {
    const { root, power } = decompose(ratio);
    const s = parseFloat(ratio.toPrecision(6));
    const texVal = power > 1 ? `(${fmtScale(root)})^${power}` : fmtScale(ratio);
    return {
      tex: ` \\cdot ${texVal} \\, \\cfrac{${toTex}}{${fromTex}}`,
      scalar: s,
      scalars: Array(power).fill(parseFloat(root.toPrecision(6))),
      isDecomposed: power > 1
    };
  }
  const inv = 1 / ratio;
  const { root, power } = decompose(inv);
  const s = parseFloat(inv.toPrecision(6));
  const texVal = power > 1 ? `(${fmtScale(root)})^${power}` : fmtScale(inv);
  return {
    tex: ` \\cdot \\cfrac{${toTex}}{${texVal} \\, ${fromTex}}`,
    scalar: s,
    scalars: Array(power).fill(parseFloat(root.toPrecision(6))),
    isDecomposed: power > 1
  };
}

/**
 * Resolves a component mismatch between two units in a dimensionless ratio
 * (e.g. Btu/h vs Btu/min, or m^3/h vs m^3/s) directly from their semantic ASTs.
 */
export function formatComponentMismatch(unitA, unitB, dimA = null, dimB = null) {
  const astA = parseUnitToSemanticAST(unitA, dimA);
  const astB = parseUnitToSemanticAST(unitB, dimB);

  const usedB = new Set();
  const pairs = [];
  for (const fA of astA) {
    const baseMetaA = BASE_UNITS[fA.base];
    if (!baseMetaA) continue;
    const idxB = astB.findIndex((fB, idx) => {
      if (usedB.has(idx)) return false;
      const baseMetaB = BASE_UNITS[fB.base];
      return baseMetaB && isDimEqual(baseMetaA.dimMap, baseMetaB.dimMap) && fB.power === fA.power;
    });
    if (idxB >= 0) {
      usedB.add(idxB);
      pairs.push([fA, astB[idxB]]);
    }
  }

  if (pairs.length === astA.length && usedB.size === astB.length && pairs.length > 0) {
    const steps = [];
    const scalars = [];

    for (const [fA, matchB] of pairs) {
      if (fA.base === matchB.base && fA.prefix === matchB.prefix) continue;
      const absP = Math.abs(fA.power);
      const uStrA = atomToPoweredUnitString(fA, absP);
      const uStrB = atomToPoweredUnitString(matchB, absP);
      const sA = getUnitAtomBag(uStrA).scale;
      const sB = getUnitAtomBag(uStrB).scale;
      const effRatio = fA.power < 0 ? (sB / sA) : (sA / sB);

      if (Math.abs(effRatio - 1) < 1e-6) continue;

      const fromAtom = fA.power < 0 ? uStrA : uStrB;
      const toAtom = fA.power < 0 ? uStrB : uStrA;
      const mag = effRatio > 1 ? effRatio : (1 / effRatio);

      let texVal = fmtScale(mag);
      if (absP > 1) {
        const root = Math.pow(mag, 1 / absP);
        if (isCanonicalScaleFactor(root)) {
          texVal = `(${fmtScale(root)})^${absP}`;
          scalars.push(...Array(absP).fill(parseFloat(root.toPrecision(6))));
        } else {
          scalars.push(parseFloat(mag.toPrecision(6)));
        }
      } else {
        scalars.push(parseFloat(mag.toPrecision(6)));
      }

      if (effRatio > 1) {
        steps.push(` \\cdot ${texVal} \\, \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{\\cancel{${unitToTex(toAtom)}}}`);
      } else {
        steps.push(` \\cdot \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{${texVal} \\, \\cancel{${unitToTex(toAtom)}}}`);
      }
    }

    if (steps.length > 0) {
      return {
        tex: steps.join(""),
        scalar: scalars[0] ?? null,
        scalars,
        isComponentBijection: true
      };
    }
  }

  return { ...formatPairConversion(unitA, unitB, dimA, dimB, "whole"), isComponentBijection: false };
}

function getAtomDimKey(dimMap) {
  if (!dimMap) return "";
  const keys = Object.keys(dimMap).sort();
  if (keys.length === 1 && dimMap.M === 1) return "M";
  if (keys.length === 1 && dimMap.T === 1) return "T";
  if (keys.length === 1 && dimMap.T === -1) return "Freq";
  if (keys.length === 3 && dimMap.M === 1 && dimMap.L === 2 && dimMap.T === -2) return "E";
  return keys.map(k => `${k}:${dimMap[k]}`).join(",");
}

function scaleDimMap(dimMap = {}, factor = 1) {
  const res = {};
  for (const [d, p] of Object.entries(dimMap)) {
    const val = p * factor;
    if (Math.abs(val) > 1e-9) res[d] = val;
  }
  return res;
}

function isOppositeDimMap(aMap = {}, bMap = {}) {
  const keysA = Object.keys(aMap);
  const keysB = Object.keys(bMap);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => Math.abs((aMap[k] || 0) + (bMap[k] || 0)) < 1e-9);
}

function getBaseFamilyKey(dimMap = {}) {
  const keys = Object.keys(dimMap).sort();
  if (keys.length === 1) return keys[0];
  return keys.map(k => `${k}:${dimMap[k]}`).join(",");
}

function atomToUnitString(atom) {
  const prefixMap = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
  const p = atom.prefix ? (prefixMap[atom.prefix] || "") : "";
  const sym = BASE_UNITS[atom.base]?.symbol || atom.base;
  return `${p}${sym}`;
}

function atomToPoweredUnitString(atom, pow = Math.abs(atom.power)) {
  const baseStr = atomToUnitString(atom);
  return pow === 1 ? baseStr : `${baseStr}^${pow}`;
}

/**
 * Decomposes a compound expression conversion (e.g. (lb/min)/(Btu/h) -> kg/kWh,
 * kg/min / gpm -> lb_m/ft^3, GPa * mm^4 / mm^3 -> N/mm) into canonical atomic
 * factor-label steps attached in-situ to each token.
 */
export function buildCompoundTokenConversions(tokenEntries, targetUnit, targetDim = null, cancelTokens = null) {
  const PRESSURE_DIM = { M: 1, L: -1, T: -2 };
  const ENERGY_DIM = { M: 1, L: 2, T: -2 };
  const FORCE_DIM = { M: 1, L: 1, T: -2 };
  const POWER_DIM = { M: 1, L: 2, T: -3 };

  const astHasDim = (ast, dMap) => ast.some(a => isDimEqual(BASE_UNITS[a.base]?.dimMap, dMap));

  const rawTargetAst = parseUnitToSemanticAST(targetUnit, targetDim);
  const entryAsts = tokenEntries.map(e => parseUnitToSemanticAST(e.uName, e.dim));

  const targetHasEnergy = astHasDim(rawTargetAst, ENERGY_DIM);
  const anyEntryHasEnergy = entryAsts.some(ast => astHasDim(ast, ENERGY_DIM));
  const hasAnyEnergy = targetHasEnergy || anyEntryHasEnergy;

  const targetHasPressure = astHasDim(rawTargetAst, PRESSURE_DIM);
  const anyEntryHasPressure = entryAsts.some(ast => astHasDim(ast, PRESSURE_DIM));

  const targetHasForce = astHasDim(rawTargetAst, FORCE_DIM);
  const anyEntryHasForce = entryAsts.some(ast => astHasDim(ast, FORCE_DIM));
  const hasAnyForce = targetHasForce || anyEntryHasForce;

  const hasAnyLen = rawTargetAst.some(a => BASE_UNITS[a.base]?.dimMap?.L)
    || entryAsts.some(ast => ast.some(a => BASE_UNITS[a.base]?.dimMap?.L));
  const hasAnyTime = rawTargetAst.some(a => BASE_UNITS[a.base]?.dimMap?.T)
    || entryAsts.some(ast => ast.some(a => BASE_UNITS[a.base]?.dimMap?.T));

  const IMPERIAL_FORCE_LEN = new Set(["pound_force", "foot", "inch", "yard"]);
  const hasImperialForceOrLen = rawTargetAst.some(a => IMPERIAL_FORCE_LEN.has(a.base))
    || entryAsts.some(ast => ast.some(a => IMPERIAL_FORCE_LEN.has(a.base)));
  const targetPrefersBtu = rawTargetAst.some(a => a.base === "Btu");

  let targetAst = rawTargetAst.map(a => ({ ...a }));
  const conversionsByToken = {};
  const cancelledIndicesByToken = {};
  const scalars = [];
  const usedTargetIndices = new Set();
  let globalConvTex = "";

  const markCancelled = (tok, idx) => {
    if (idx === null || idx === undefined) return;
    if (!cancelledIndicesByToken[tok]) cancelledIndicesByToken[tok] = new Set();
    cancelledIndicesByToken[tok].add(idx);
  };

  function expandDerivedAtom(atom) {
    const pfx = atom.prefix;
    if (atom.base === "Watt") {
      if (!pfx) return { unit: "J/s", scale: 1 };
      if (pfx === "kilo") return { unit: "kJ/s", scale: 1 };
    }
    if (atom.base === "Joule") {
      if (!pfx) return { unit: "N*m", scale: 1 };
      if (pfx === "kilo") return { unit: "kN*m", scale: 1 };
    }
    if (atom.base === "newton") {
      if (!pfx) return { unit: "kg*m/s^2", scale: 1 };
      if (pfx === "kilo") return { unit: "kg*m/s^2", scale: 1000 };
    }
    if (atom.base === "Pascal") {
      if (!pfx) return { unit: "N/m^2", scale: 1 };
      if (pfx === "kilo") return { unit: "kN/m^2", scale: 1 };
      if (pfx === "mega") return { unit: "N/mm^2", scale: 1 };
      if (pfx === "giga") return { unit: "kN/mm^2", scale: 1 };
    }
    if (atom.base === "horsepower") {
      return hasAnyEnergy
        ? { unit: targetPrefersBtu ? "Btu/min" : "kJ/s", scale: getUnitAtomBag("hp").scale / getUnitAtomBag(targetPrefersBtu ? "Btu/min" : "kJ/s").scale }
        : { unit: "ft-lb_f/s", scale: 550 };
    }
    if (atom.base === "bar") return { unit: "kN/m^2", scale: 100 };
    if (atom.base === "Btu") {
      return (hasAnyForce && hasImperialForceOrLen)
        ? { unit: "ft-lb_f", scale: 778.169 }
        : { unit: "J", scale: 1055.056 };
    }
    if (atom.base === "kWh") return { unit: "kJ", scale: 3600 };
    if (needsMassForceBridge && BASE_UNITS[atom.base]?.massCompanion) {
      const isImperial = atom.base === "pound_force";
      const baseForceStr = isImperial ? "lb_f" : "kg_f";
      const fStr = atomToUnitString({ prefix: atom.prefix, base: atom.base, power: 1 });
      const prefixScale = getUnitAtomBag(fStr).scale / getUnitAtomBag(baseForceStr).scale;
      if (Math.abs(prefixScale - 1) > 1e-6) {
        return { unit: baseForceStr, scale: prefixScale };
      }
      const mStr = isImperial ? "lb_m" : "kg";
      const lStr = isImperial ? "ft" : "m";
      const gc = getUnitAtomBag(baseForceStr).scale / (getUnitAtomBag(mStr).scale * getUnitAtomBag(lStr).scale);
      return { unit: `${mStr}*${lStr}/s^2`, scale: gc };
    }
    return null;
  }

  const targetHasMass = targetAst.some(a => getAtomDimKey(BASE_UNITS[a.base]?.dimMap) === "M");
  const targetHasTime = targetAst.some(a => getAtomDimKey(BASE_UNITS[a.base]?.dimMap) === "T");
  const targetHasLen = targetAst.some(a => BASE_UNITS[a.base]?.dimMap?.L === 1);
  const netPureMassSource = tokenEntries.reduce((acc, entry) => {
    const ast = parseUnitToSemanticAST(entry.uName, entry.dim);
    const mAtoms = ast.filter(a => getAtomDimKey(BASE_UNITS[a.base]?.dimMap) === "M");
    return acc + mAtoms.reduce((s, a) => s + a.power * entry.exp, 0);
  }, 0);
  const netPureMassTarget = targetAst
    .filter(a => getAtomDimKey(BASE_UNITS[a.base]?.dimMap) === "M")
    .reduce((s, a) => s + a.power, 0);
  const hasUnmatchedPureMass = Math.abs(netPureMassSource - netPureMassTarget) > 1e-6;
  const needsMassForceBridge = !hasAnyEnergy && hasUnmatchedPureMass;

  // Target-side mirror of the source g_c bridge below: a surviving gravitational-force
  // target atom (lb_f, kg_f) unpacks to mass*length/time^2 with g_c as the scale.
  function expandTargetForce(atom) {
    if (!needsMassForceBridge || !BASE_UNITS[atom.base]?.massCompanion) return null;
    const isImperial = atom.base === "pound_force";
    const baseForceStr = isImperial ? "lb_f" : "kg_f";
    const fStr = atomToUnitString({ prefix: atom.prefix, base: atom.base, power: 1 });
    const prefixScale = getUnitAtomBag(fStr).scale / getUnitAtomBag(baseForceStr).scale;
    if (Math.abs(prefixScale - 1) > 1e-6) {
      return { unit: baseForceStr, scale: prefixScale };
    }
    const mStr = isImperial ? "lb_m" : "kg";
    const hasInch = targetAst.some((a, i) => !usedTargetIndices.has(i) && a.base === "inch");
    const lStr = isImperial ? (hasInch ? "in" : "ft") : "m";
    const gc = getUnitAtomBag(baseForceStr).scale / (getUnitAtomBag(mStr).scale * getUnitAtomBag(lStr).scale);
    return { unit: `${mStr}*${lStr}/s^2`, scale: gc };
  }

  // Flatten all source atoms at their native abstraction level (unpacking g_c force/mass if needed)
  const sourceAtoms = [];
  for (const entry of tokenEntries) {
    if (!cancelledIndicesByToken[entry.tok]) cancelledIndicesByToken[entry.tok] = new Set();

    let ast = parseUnitToSemanticAST(entry.uName, entry.dim).map((atom, idx) => ({
      ...atom,
      origIndex: idx
    }));

    const gravForceIdx = needsMassForceBridge
      ? ast.findIndex(a => !!(BASE_UNITS[a.base]?.massCompanion && a.power === 1))
      : -1;

    if (gravForceIdx >= 0) {
      const fAtom = ast[gravForceIdx];
      const fStr = atomToUnitString(fAtom);
      const isImperialForce = fAtom.base === "pound_force";
      const baseForceStr = isImperialForce ? "lb_f" : "kg_f";
      const mStr = isImperialForce ? "lb_m" : "kg";

      const lenAtom = ast.find(a => a !== fAtom && BASE_UNITS[a.base]?.dimMap?.L === 1);
      const lenAtomStr = lenAtom ? atomToUnitString(lenAtom) : null;
      const lStr = isImperialForce ? (lenAtomStr === "in" ? "in" : "ft") : "m";

      if (!conversionsByToken[entry.tok]) conversionsByToken[entry.tok] = [];

      // Unpack prefix on gravitational force (e.g. klb_f -> 1000 lb_f) so gc stays canonical
      if (fStr !== baseForceStr) {
        const prefixRatio = getUnitAtomBag(fStr).scale / getUnitAtomBag(baseForceStr).scale;
        if (Math.abs(prefixRatio - 1) > 1e-6) {
          scalars.push(parseFloat((prefixRatio > 1 ? prefixRatio : 1 / prefixRatio).toPrecision(6)));
          if (prefixRatio > 1) {
            conversionsByToken[entry.tok].push(` \\cdot ${fmtScale(prefixRatio)} \\, \\cfrac{\\cancel{${unitToTex(baseForceStr)}}}{\\cancel{${unitToTex(fStr)}}}`);
          } else {
            conversionsByToken[entry.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(baseForceStr)}}}{${fmtScale(1 / prefixRatio)} \\, \\cancel{${unitToTex(fStr)}}}`);
          }
        }
      }

      const gc = getUnitAtomBag(baseForceStr).scale / (getUnitAtomBag(mStr).scale * getUnitAtomBag(lStr).scale);
      scalars.push(parseFloat(gc.toPrecision(6)));

      const tokenHasMatchingLen = !!(lenAtom && lenAtom.power === -1 && lenAtomStr === lStr);
      const mTex = targetHasMass ? unitToTex(mStr) : unitToCancelledTex(mStr, false, null, "component");
      const lTex = (tokenHasMatchingLen || !targetHasLen) ? unitToCancelledTex(lStr, false, null, "component") : unitToTex(lStr);
      const s2Tex = targetHasTime ? "\\text{s}^{2}" : "\\cancel{\\text{s}^{2}}";

      conversionsByToken[entry.tok].push(
        ` \\cdot ${fmtScale(gc)} \\, \\cfrac{${mTex} \\cdot ${lTex}}{\\cancel{${unitToTex(baseForceStr)}} \\cdot ${s2Tex}}`
      );

      markCancelled(entry.tok, fAtom.origIndex);
      if (tokenHasMatchingLen && lenAtom) {
        markCancelled(entry.tok, lenAtom.origIndex);
      }

      // Rebuild remaining AST after replacing gravitational force with mStr * lStr / s^2
      const nextFactors = [];
      for (let idx = 0; idx < ast.length; idx++) {
        if (idx === gravForceIdx) continue;
        if (tokenHasMatchingLen && ast[idx] === lenAtom) continue;
        nextFactors.push(ast[idx]);
      }
      const mResolved = resolveUnitToken(mStr, DIMENSIONS.MASS);
      nextFactors.push({ prefix: mResolved.prefix, base: mResolved.base, power: 1, origIndex: null });
      if (!tokenHasMatchingLen) {
        const lResolved = resolveUnitToken(lStr, DIMENSIONS.LENGTH);
        nextFactors.push({ prefix: lResolved.prefix, base: lResolved.base, power: 1, origIndex: null });
      }
      nextFactors.push({ prefix: null, base: "second", power: -2, origIndex: null });
      ast = nextFactors;
    }

    ast.forEach(atom => {
      const baseDim = BASE_UNITS[atom.base]?.dimMap || {};
      const netPower = atom.power * entry.exp;
      sourceAtoms.push({
        tok: entry.tok,
        atom,
        origIndex: atom.origIndex ?? null,
        exp: entry.exp,
        netPower,
        dim: getAtomDimKey(baseDim) || atom.base,
        family: getBaseFamilyKey(baseDim) || atom.base,
        atomDimVec: scaleDimMap(baseDim, atom.power),
        netDimVec: scaleDimMap(baseDim, netPower)
      });
    });
  }

  const emitSingleUnitConversion = (tok, srcStr, tgtStr, atomPower, expPow = 1, cancelBoth = false) => {
    const sSrc = getUnitAtomBag(srcStr).scale;
    const sTgt = getUnitAtomBag(tgtStr).scale;
    const ratio = sSrc / sTgt;
    if (Math.abs(ratio - 1) <= 1e-6) return false;

    const mag = ratio > 1 ? ratio : (1 / ratio);
    const directRoot = expPow > 1 ? Math.pow(mag, 1 / expPow) : mag;

    // Decompose fused prefix*base conversions (e.g. um -> in = 10^-6 * 39.3701) into decade + base steps
    if (!isCanonicalScaleFactor(directRoot)) {
      const srcAst = parseUnitToSemanticAST(srcStr);
      const tgtAst = parseUnitToSemanticAST(tgtStr);
      if (srcAst.length === 1 && tgtAst.length === 1 && srcAst[0].base !== tgtAst[0].base && (srcAst[0].prefix || tgtAst[0].prefix)) {
        const bareSrc = atomToPoweredUnitString({ prefix: null, base: srcAst[0].base, power: 1 }, Math.abs(srcAst[0].power));
        const bareTgt = atomToPoweredUnitString({ prefix: null, base: tgtAst[0].base, power: 1 }, Math.abs(tgtAst[0].power));
        const steps = [];
        if (srcStr !== bareSrc) steps.push([srcStr, bareSrc, true]);
        if (bareSrc !== bareTgt) steps.push([bareSrc, bareTgt, tgtStr !== bareTgt || cancelBoth]);
        if (bareTgt !== tgtStr) steps.push([bareTgt, tgtStr, cancelBoth]);
        if (steps.length > 1) {
          let emitted = false;
          for (const [a, b, cancelB] of steps) {
            if (emitSingleUnitConversion(tok, a, b, atomPower, expPow, cancelB)) emitted = true;
          }
          return emitted;
        }
      }
    }

    if (!conversionsByToken[tok]) conversionsByToken[tok] = [];

    let texVal = fmtScale(mag);
    if (expPow > 1) {
      const root = Math.pow(mag, 1 / expPow);
      if (isCanonicalScaleFactor(root)) {
        texVal = `(${fmtScale(root)})^${expPow}`;
        scalars.push(...Array(expPow).fill(parseFloat(root.toPrecision(6))));
      } else {
        scalars.push(parseFloat(mag.toPrecision(6)));
      }
    } else {
      scalars.push(parseFloat(mag.toPrecision(6)));
    }

    const srcTex = unitToCancelledTex(srcStr, false, null, "whole");
    const tgtTex = cancelBoth ? unitToCancelledTex(tgtStr, false, null, "whole") : unitToTex(tgtStr);

    if (atomPower > 0) {
      if (ratio > 1) {
        conversionsByToken[tok].push(` \\cdot ${texVal} \\, \\cfrac{${tgtTex}}{${srcTex}}`);
      } else {
        conversionsByToken[tok].push(` \\cdot \\cfrac{${tgtTex}}{${texVal} \\, ${srcTex}}`);
      }
    } else {
      if (ratio > 1) {
        conversionsByToken[tok].push(` \\cdot \\cfrac{${srcTex}}{${texVal} \\, ${tgtTex}}`);
      } else {
        conversionsByToken[tok].push(` \\cdot ${texVal} \\, \\cfrac{${srcTex}}{${tgtTex}}`);
      }
    }
    return true;
  };

  function coalesceUnusedTargetAtoms() {
    const kept = [];
    const merged = new Map();
    for (let idx = 0; idx < targetAst.length; idx++) {
      const t = targetAst[idx];
      if (usedTargetIndices.has(idx)) {
        kept.push(t);
      } else {
        const key = `${t.prefix || ""}|${t.base}`;
        if (!merged.has(key)) merged.set(key, { prefix: t.prefix, base: t.base, power: 0 });
        merged.get(key).power += t.power;
      }
    }
    targetAst = kept;
    usedTargetIndices.clear();
    kept.forEach((_, idx) => usedTargetIndices.add(idx));
    for (const m of merged.values()) {
      if (Math.abs(m.power) > 1e-9) targetAst.push(m);
    }
  }

  function runMatchingPass() {
    coalesceUnusedTargetAtoms();
    // 0. Pair reciprocal Frequency (Hz/kHz/MHz) <-> Time (s/ms/min/h) via 1 Hz * 1 s = 1
    for (const src of sourceAtoms) {
      if (src.matched || (src.dim !== "Freq" && src.dim !== "T")) continue;
      if (Math.abs(src.atom.power) !== 1) continue;
      const wantedDim = src.dim === "Freq" ? "T" : "Freq";
      const tIdx = targetAst.findIndex((tAtom, idx) => {
        if (usedTargetIndices.has(idx)) return false;
        if (Math.abs(tAtom.power) !== 1) return false;
        const tDim = getAtomDimKey(BASE_UNITS[tAtom.base]?.dimMap) || tAtom.base;
        const isRecipPair =
          (src.dim === "Freq" && src.atom.base === "hertz" && tDim === "T") ||
          (src.dim === "T" && tAtom.base === "hertz");
        if (!isRecipPair || tDim !== wantedDim) return false;
        const tNetDim = scaleDimMap(BASE_UNITS[tAtom.base]?.dimMap || {}, tAtom.power);
        return isDimEqual(src.netDimVec, tNetDim);
      });

      if (tIdx >= 0) {
        usedTargetIndices.add(tIdx);
        src.matched = true;
        markCancelled(src.tok, src.origIndex);
        const tAtom = targetAst[tIdx];
        const srcStr = atomToUnitString(src.atom);
        const tgtStr = atomToUnitString(tAtom);
        const sSrc = getUnitAtomBag(srcStr).scale;
        const sTgt = getUnitAtomBag(tgtStr).scale;
        const prod = sSrc * sTgt;

        if (!conversionsByToken[src.tok]) conversionsByToken[src.tok] = [];
        if (src.atom.power > 0) {
          if (Math.abs(prod - 1) < 1e-6) {
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{1}{${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}}`);
          } else if (prod < 1) {
            const factor = 1 / prod;
            scalars.push(parseFloat(factor.toPrecision(6)));
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{1}{${fmtScale(factor)} \\, ${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}}`);
          } else {
            scalars.push(parseFloat(prod.toPrecision(6)));
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{${fmtScale(prod)}}{${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}}`);
          }
        } else {
          if (Math.abs(prod - 1) < 1e-6) {
            conversionsByToken[src.tok].push(` \\cdot ${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}`);
          } else if (prod < 1) {
            const factor = 1 / prod;
            scalars.push(parseFloat(factor.toPrecision(6)));
            conversionsByToken[src.tok].push(` \\cdot ${fmtScale(factor)} \\, ${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}`);
          } else {
            scalars.push(parseFloat(prod.toPrecision(6)));
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{${unitToTex(tgtStr)} \\cdot \\cancel{${unitToTex(srcStr)}}}{${fmtScale(prod)}}`);
          }
        }
      }
    }

    // 1. Pair source atoms with matching target atoms by full 7D net dimensional vector
    for (const src of sourceAtoms) {
      if (src.matched) continue;
      const tIdx = targetAst.findIndex((tAtom, idx) => {
        if (usedTargetIndices.has(idx)) return false;
        const tNetDim = scaleDimMap(BASE_UNITS[tAtom.base]?.dimMap || {}, tAtom.power);
        if (!isDimEqual(src.netDimVec, tNetDim)) return false;
        const cleanPow = Math.abs(tAtom.power / src.exp);
        return cleanPow >= 1 - 1e-6 && Math.abs(cleanPow - Math.round(cleanPow)) < 1e-6;
      });

      if (tIdx >= 0) {
        usedTargetIndices.add(tIdx);
        const tAtom = targetAst[tIdx];
        const tgtPow = Math.max(1, Math.round(Math.abs(tAtom.power / src.exp)));
        const srcPow = Math.abs(src.atom.power);
        const srcStr = atomToPoweredUnitString(src.atom, srcPow);
        const tgtStr = atomToPoweredUnitString(tAtom, tgtPow);

        const expPow = (src.atom.base !== tAtom.base && isDimEqual(BASE_UNITS[src.atom.base]?.dimMap, BASE_UNITS[tAtom.base]?.dimMap))
          ? Math.min(srcPow, tgtPow)
          : 1;

        const cancelBoth = !!cancelTokens?.has(src.tok);
        if (emitSingleUnitConversion(src.tok, srcStr, tgtStr, src.atom.power, expPow, cancelBoth) || cancelBoth) {
          markCancelled(src.tok, src.origIndex);
        }
        src.resolvedUnit = tgtStr;
        src.matched = true;
      }
    }

    // 2. Pair remaining unmatched source atoms that cancel each other across tokens (e.g. min vs h, gal vs ft^3)
    const unmatched = sourceAtoms.filter(s => !s.matched);
    for (let i = 0; i < unmatched.length; i++) {
      const a = unmatched[i];
      if (a.matched) continue;
      const partner = unmatched.find((b, j) => {
        if (j <= i || b.matched || !isOppositeDimMap(a.netDimVec, b.netDimVec)) return false;
        const cleanPow = Math.abs(b.netPower / a.exp);
        return cleanPow >= 1 - 1e-6 && Math.abs(cleanPow - Math.round(cleanPow)) < 1e-6;
      });
      if (partner) {
        const targetPow = Math.max(1, Math.round(Math.abs(partner.netPower / a.exp)));
        const aDimAtExp = scaleDimMap(BASE_UNITS[a.atom.base]?.dimMap || {}, Math.abs(a.atom.power));
        const pDimAtExp = scaleDimMap(BASE_UNITS[partner.atom.base]?.dimMap || {}, targetPow);
        if (!isDimEqual(aDimAtExp, pDimAtExp)) continue;

        a.matched = true;
        partner.matched = true;
        markCancelled(a.tok, a.origIndex);
        markCancelled(partner.tok, partner.origIndex);

        const aPow = Math.abs(a.atom.power);
        const strA = atomToPoweredUnitString(a.atom, aPow);
        const strB = atomToPoweredUnitString(partner.atom, targetPow);
        const sA = getUnitAtomBag(strA).scale;
        const sB = getUnitAtomBag(strB).scale;
        const ratio = sA / sB;

        a.resolvedUnit = strB;
        partner.resolvedUnit = strB;
        if (Math.abs(ratio - 1) > 1e-6) {
          const expPow = (a.atom.base !== partner.atom.base && isDimEqual(BASE_UNITS[a.atom.base]?.dimMap, BASE_UNITS[partner.atom.base]?.dimMap))
            ? Math.min(aPow, targetPow)
            : 1;
          emitSingleUnitConversion(a.tok, strA, strB, a.atom.power, expPow, true);
        }
      }
    }
  }

  const getAtomUnpackRank = (atom, expRes) => {
    if (!expRes) return 0;
    if (atom.base === "Watt" || atom.base === "horsepower") return 4;
    if (atom.base === "Pascal" || atom.base === "bar" || atom.base === "Joule" || atom.base === "Btu" || atom.base === "kWh") return 3;
    return 2;
  };

  // Iterative level-by-level matching + SUBSTITUTION_GRAPH unpacking (highest abstraction rank first)
  for (let pass = 0; pass < 12; pass++) {
    runMatchingPass();

    const hasUnmatchedSource = sourceAtoms.some(s => !s.matched);
    const hasUnmatchedTarget = targetAst.some((_, idx) => !usedTargetIndices.has(idx));
    if (!hasUnmatchedSource && !hasUnmatchedTarget) break;

    let unpackedAny = false;
    let maxRank = 0;
    for (const src of sourceAtoms) {
      if (src.matched) continue;
      maxRank = Math.max(maxRank, getAtomUnpackRank(src.atom, expandDerivedAtom(src.atom)));
    }
    for (let idx = 0; idx < targetAst.length; idx++) {
      if (usedTargetIndices.has(idx)) continue;
      const t = targetAst[idx];
      if (Math.abs(t.power) < 1 || !Number.isInteger(t.power)) continue;
      maxRank = Math.max(maxRank, getAtomUnpackRank(t, expandDerivedAtom(t) || expandTargetForce(t)));
    }
    if (maxRank === 0) break;

    // Align balanced Force source atoms (e.g. psi^(1/2)*MPa^(1/2)/kPa) before unpacking newton -> kg*m/s^2
    if (maxRank <= 2) {
      const forceUnmatched = sourceAtoms.filter(s => !s.matched && s.family === "L:1,M:1,T:-2");
      const targetNeedsForceUnpack = targetAst.some((t, idx) => !usedTargetIndices.has(idx) && BASE_UNITS[t.base]?.dimMap?.M);
      if (forceUnmatched.length > 1 && !targetNeedsForceUnpack) {
        const netForce = forceUnmatched.reduce((s, x) => s + x.netPower, 0);
        if (Math.abs(netForce) < 1e-6) {
          const canonForce = forceUnmatched.find(s => !s.atom.prefix && !BASE_UNITS[s.atom.base]?.massCompanion)
            || forceUnmatched.find(s => !s.atom.prefix)
            || forceUnmatched[0];
          const canonAtom = { prefix: canonForce.atom.prefix, base: canonForce.atom.base, power: 1 };
          for (const src of forceUnmatched) {
            markCancelled(src.tok, src.origIndex);
            const srcPow = Math.abs(src.atom.power);
            const srcStr = atomToPoweredUnitString(src.atom, srcPow);
            const tgtStr = atomToPoweredUnitString(canonAtom, srcPow);
            emitSingleUnitConversion(src.tok, srcStr, tgtStr, src.atom.power, srcPow, true);
            src.resolvedUnit = tgtStr;
            src.matched = true;
          }
          continue;
        }
      }
    }

    for (let i = sourceAtoms.length - 1; i >= 0; i--) {
      const src = sourceAtoms[i];
      if (src.matched) continue;
      const expRes = expandDerivedAtom(src.atom);
      if (getAtomUnpackRank(src.atom, expRes) !== maxRank) continue;

      unpackedAny = true;
      sourceAtoms.splice(i, 1);

      if (Math.abs(expRes.scale - 1) > 1e-6) {
        if (!conversionsByToken[src.tok]) conversionsByToken[src.tok] = [];
        const srcStr = atomToUnitString(src.atom);
        const r = expRes.scale;
        scalars.push(parseFloat(r.toPrecision(6)));
        markCancelled(src.tok, src.origIndex);
        if (src.atom.power > 0) {
          conversionsByToken[src.tok].push(` \\cdot ${fmtScale(r)} \\, \\cfrac{${unitToTex(expRes.unit, true)}}{\\cancel{${unitToTex(srcStr)}}}`);
        } else {
          conversionsByToken[src.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(srcStr)}}}{${fmtScale(r)} \\, ${unitToTex(expRes.unit, true)}}`);
        }
      }

      const subFactors = parseUnitToSemanticAST(expRes.unit);
      subFactors.forEach(f => {
        const baseDim = BASE_UNITS[f.base]?.dimMap || {};
        const atomPower = f.power * src.atom.power;
        const netPower = atomPower * src.exp;
        sourceAtoms.push({
          tok: src.tok,
          atom: { prefix: f.prefix, base: f.base, power: atomPower },
          origIndex: Math.abs(expRes.scale - 1) > 1e-6 ? null : src.origIndex,
          exp: src.exp,
          netPower,
          dim: getAtomDimKey(baseDim) || f.base,
          family: getBaseFamilyKey(baseDim) || f.base,
          atomDimVec: scaleDimMap(baseDim, atomPower),
          netDimVec: scaleDimMap(baseDim, netPower)
        });
      });
    }

    for (let idx = targetAst.length - 1; idx >= 0; idx--) {
      if (usedTargetIndices.has(idx)) continue;
      const tAtom = targetAst[idx];
      if (Math.abs(tAtom.power) < 1 || !Number.isInteger(tAtom.power)) continue;
      const expRes = expandDerivedAtom(tAtom) || expandTargetForce(tAtom);
      if (getAtomUnpackRank(tAtom, expRes) !== maxRank) continue;

      unpackedAny = true;
      usedTargetIndices.add(idx);
      const tSign = Math.sign(tAtom.power);
      const tAbs = Math.abs(tAtom.power);
      if (Math.abs(expRes.scale - 1) > 1e-6) {
        const r = expRes.scale;
        scalars.push(...Array(tAbs).fill(parseFloat(r.toPrecision(6))));
        const tStr = atomToPoweredUnitString(tAtom, tAbs);
        const expTex = tAbs > 1 ? `\\cancel{${unitToTex(expRes.unit, true)}}^{${tAbs}}` : `\\cancel{${unitToTex(expRes.unit, true)}}`;
        const scaleTex = tAbs > 1 ? `(${fmtScale(r)})^${tAbs}` : fmtScale(r);
        globalConvTex += tSign > 0
          ? ` \\cdot \\cfrac{${unitToTex(tStr)}}{${scaleTex} \\, ${expTex}}`
          : ` \\cdot ${scaleTex} \\, \\cfrac{${expTex}}{${unitToTex(tStr)}}`;
      }

      const subFactors = parseUnitToSemanticAST(expRes.unit);
      subFactors.forEach(f => {
        targetAst.push({ prefix: f.prefix, base: f.base, power: f.power * tSign * tAbs });
      });
    }

    if (!unpackedAny) break;
  }

  // 3. Residual dimension-family alignment (e.g. D_m / d_w^3 -> mm^-2, G * d_w^4 / D_m^3 -> lb_f/in)
  const stillUnmatched = sourceAtoms.filter(s => !s.matched);
  if (stillUnmatched.length > 0) {
    const families = new Map();
    for (const src of stillUnmatched) {
      if (!families.has(src.family)) families.set(src.family, []);
      families.get(src.family).push(src);
    }

    for (const [fam, list] of families.entries()) {
      const tgtMatches = targetAst
        .map((tAtom, idx) => ({ tAtom, idx }))
        .filter(({ tAtom, idx }) => !usedTargetIndices.has(idx) && getBaseFamilyKey(BASE_UNITS[tAtom.base]?.dimMap || {}) === fam);

      if (tgtMatches.length > 0) {
        const preferred = tgtMatches.find(({ tAtom }) =>
          list.some(src => src.atom.base === tAtom.base && src.atom.prefix === tAtom.prefix)
        ) || tgtMatches[0];
        const tgtMatch = preferred.tAtom;
        const tgtBaseDim = BASE_UNITS[tgtMatch.base]?.dimMap || {};
        const tgtUnitAtom = { prefix: tgtMatch.prefix, base: tgtMatch.base, power: 1 };
        for (const src of list) {
          const srcBaseDim = BASE_UNITS[src.atom.base]?.dimMap || {};
          // Compute exact target power matching src's atomic dimension
          const factor = Object.keys(srcBaseDim).reduce((acc, k) => {
            return (tgtBaseDim[k] && srcBaseDim[k]) ? (srcBaseDim[k] * Math.abs(src.atom.power)) / tgtBaseDim[k] : acc;
          }, Math.abs(src.atom.power));
          const tgtPow = Math.max(1, Math.round(Math.abs(factor)));
          const srcStr = atomToPoweredUnitString(src.atom, Math.abs(src.atom.power));
          const tgtStr = atomToPoweredUnitString(tgtUnitAtom, tgtPow);
          const expPow = isDimEqual(srcBaseDim, tgtBaseDim) ? Math.min(Math.abs(src.atom.power), tgtPow) : 1;

          const cancelBoth = !!cancelTokens?.has(src.tok);
          if (emitSingleUnitConversion(src.tok, srcStr, tgtStr, src.atom.power, expPow, cancelBoth) || cancelBoth) {
            markCancelled(src.tok, src.origIndex);
          }
          src.resolvedUnit = tgtStr;
          src.matched = true;
        }
        for (const { tAtom: otherTgt, idx: otherIdx } of tgtMatches) {
          usedTargetIndices.add(otherIdx);
          if (otherTgt === tgtMatch) continue;
          if (otherTgt.base === tgtMatch.base && otherTgt.prefix === tgtMatch.prefix) continue;
          const absP = Math.abs(otherTgt.power);
          const fromStr = atomToPoweredUnitString(tgtUnitAtom, absP);
          const toStr = atomToPoweredUnitString(otherTgt, absP);
          const sFrom = getUnitAtomBag(fromStr).scale;
          const sTo = getUnitAtomBag(toStr).scale;
          const ratio = sFrom / sTo;
          if (Math.abs(ratio - 1) > 1e-6) {
            const mag = ratio > 1 ? ratio : (1 / ratio);
            let texVal = fmtScale(mag);
            if (absP > 1) {
              const root = Math.pow(mag, 1 / absP);
              if (isCanonicalScaleFactor(root)) {
                texVal = `(${fmtScale(root)})^${absP}`;
                scalars.push(...Array(absP).fill(parseFloat(root.toPrecision(6))));
              } else {
                scalars.push(parseFloat(mag.toPrecision(6)));
              }
            } else {
              scalars.push(parseFloat(mag.toPrecision(6)));
            }
            const fromTex = unitToCancelledTex(fromStr, false, null, "whole");
            const toTex = unitToTex(toStr);
            if (otherTgt.power > 0) {
              globalConvTex += ratio > 1
                ? ` \\cdot ${texVal} \\, \\cfrac{${toTex}}{${fromTex}}`
                : ` \\cdot \\cfrac{${toTex}}{${texVal} \\, ${fromTex}}`;
            } else {
              globalConvTex += ratio > 1
                ? ` \\cdot \\cfrac{${fromTex}}{${texVal} \\, ${toTex}}`
                : ` \\cdot ${texVal} \\, \\cfrac{${fromTex}}{${toTex}}`;
            }
          }
        }
      } else {
        const netFamPower = list.reduce((s, x) => s + x.netPower, 0);
        if (Math.abs(netFamPower) < 1e-6) {
          // Family sums to zero across unmatched sources: align all to the first/canonical unit in family
          const canonSrc = list.find(s => !s.atom.prefix) || list[0];
          const canonBaseDim = BASE_UNITS[canonSrc.atom.base]?.dimMap || {};
          const canonAtom = { prefix: canonSrc.atom.prefix, base: canonSrc.atom.base, power: 1 };
          for (const src of list) {
            markCancelled(src.tok, src.origIndex);
            const srcBaseDim = BASE_UNITS[src.atom.base]?.dimMap || {};
            const factor = Object.keys(srcBaseDim).reduce((acc, k) => {
              return (canonBaseDim[k] && srcBaseDim[k]) ? (canonBaseDim[k] * Math.abs(src.atom.power)) / canonBaseDim[k] : acc;
            }, Math.abs(src.atom.power));
            const tgtPow = Math.max(1, Math.round(Math.abs(factor)));
            const srcStr = atomToPoweredUnitString(src.atom, Math.abs(src.atom.power));
            const tgtStr = atomToPoweredUnitString(canonAtom, tgtPow);
            const expPow = isDimEqual(srcBaseDim, canonBaseDim) ? Math.min(Math.abs(src.atom.power), tgtPow) : 1;

            emitSingleUnitConversion(src.tok, srcStr, tgtStr, src.atom.power, expPow, true);
            src.resolvedUnit = tgtStr;
            src.matched = true;
          }
        }
      }
    }
  }

  // 4. Residual unused target-only families summing to zero (e.g. m^+1 and mm^-1 in N/mm when source has no L)
  const unusedTargetsByFam = new Map();
  for (let idx = 0; idx < targetAst.length; idx++) {
    if (usedTargetIndices.has(idx)) continue;
    const tAtom = targetAst[idx];
    const fam = getBaseFamilyKey(BASE_UNITS[tAtom.base]?.dimMap || {}) || tAtom.base;
    if (!unusedTargetsByFam.has(fam)) unusedTargetsByFam.set(fam, []);
    unusedTargetsByFam.get(fam).push({ tAtom, idx });
  }
  for (const tList of unusedTargetsByFam.values()) {
    if (tList.length < 2) continue;
    const netPow = tList.reduce((s, x) => s + x.tAtom.power, 0);
    if (Math.abs(netPow) >= 1e-6) continue;
    const ref = tList[0].tAtom;
    const refUnitAtom = { prefix: ref.prefix, base: ref.base, power: 1 };
    for (const { tAtom: otherTgt, idx: otherIdx } of tList) {
      usedTargetIndices.add(otherIdx);
      if (otherTgt === ref) continue;
      if (otherTgt.base === ref.base && otherTgt.prefix === ref.prefix) continue;
      const absP = Math.abs(otherTgt.power);
      const fromStr = atomToPoweredUnitString(refUnitAtom, absP);
      const toStr = atomToPoweredUnitString(otherTgt, absP);
      const sFrom = getUnitAtomBag(fromStr).scale;
      const sTo = getUnitAtomBag(toStr).scale;
      const ratio = sFrom / sTo;
      if (Math.abs(ratio - 1) > 1e-6) {
        const mag = ratio > 1 ? ratio : (1 / ratio);
        let texVal = fmtScale(mag);
        if (absP > 1) {
          const root = Math.pow(mag, 1 / absP);
          if (isCanonicalScaleFactor(root)) {
            texVal = `(${fmtScale(root)})^${absP}`;
            scalars.push(...Array(absP).fill(parseFloat(root.toPrecision(6))));
          } else {
            scalars.push(parseFloat(mag.toPrecision(6)));
          }
        } else {
          scalars.push(parseFloat(mag.toPrecision(6)));
        }
        const fromTex = unitToCancelledTex(fromStr, false, null, "whole");
        const toTex = unitToTex(toStr);
        if (otherTgt.power > 0) {
          globalConvTex += ratio > 1
            ? ` \\cdot ${texVal} \\, \\cfrac{${toTex}}{${fromTex}}`
            : ` \\cdot \\cfrac{${toTex}}{${texVal} \\, ${fromTex}}`;
        } else {
          globalConvTex += ratio > 1
            ? ` \\cdot \\cfrac{${fromTex}}{${texVal} \\, ${toTex}}`
            : ` \\cdot ${texVal} \\, \\cfrac{${fromTex}}{${toTex}}`;
        }
      }
    }
  }

  const resolvedUnitsByToken = {};
  for (const entry of tokenEntries) {
    const nums = [];
    const dens = [];
    for (const src of sourceAtoms) {
      if (src.tok !== entry.tok) continue;
      const uPart = src.resolvedUnit || atomToPoweredUnitString(src.atom, Math.abs(src.atom.power));
      if (src.atom.power > 0) nums.push(uPart);
      else if (src.atom.power < 0) dens.push(uPart);
    }
    const nStr = nums.join("*");
    const dStr = dens.join("*");
    resolvedUnitsByToken[entry.tok] = dStr ? `${nStr || "1"}/(${dStr})` : (nStr || "dimless");
  }

  return { conversionsByToken, scalars, cancelledIndicesByToken, globalConvTex, resolvedUnitsByToken };
}

// ============================================================================
// SINGLE-SOURCE-OF-TRUTH CANONICAL RATIO REGISTRY (FOR AUTOMATED VERIFICATION)
// ============================================================================

let cachedRatios = null;

function getRegisteredPairwiseRatios() {
  if (cachedRatios) return cachedRatios;
  const ratios = new Set();

  // Explicit unit-to-dimension pairs (no substring guessing like .includes("lb/"))
  const registeredUnits = [
    { u: "g", dim: DIMENSIONS.MASS }, { u: "kg", dim: DIMENSIONS.MASS }, { u: "g_m", dim: DIMENSIONS.MASS }, { u: "kg_m", dim: DIMENSIONS.MASS },
    { u: "lb", dim: DIMENSIONS.MASS }, { u: "lbm", dim: DIMENSIONS.MASS }, { u: "lb_m", dim: DIMENSIONS.MASS }, { u: "klb_m", dim: DIMENSIONS.MASS },
    { u: "N", dim: DIMENSIONS.FORCE }, { u: "kN", dim: DIMENSIONS.FORCE }, { u: "lb", dim: DIMENSIONS.FORCE },
    { u: "lbf", dim: DIMENSIONS.FORCE }, { u: "lb_f", dim: DIMENSIONS.FORCE }, { u: "klb_f", dim: DIMENSIONS.FORCE },
    { u: "g_f", dim: DIMENSIONS.FORCE }, { u: "kgf", dim: DIMENSIONS.FORCE }, { u: "kg_f", dim: DIMENSIONS.FORCE }, { u: "kip", dim: DIMENSIONS.FORCE },
    { u: "m", dim: DIMENSIONS.LENGTH }, { u: "mm", dim: DIMENSIONS.LENGTH }, { u: "cm", dim: DIMENSIONS.LENGTH },
    { u: "in", dim: DIMENSIONS.LENGTH }, { u: "ft", dim: DIMENSIONS.LENGTH }, { u: "yd", dim: DIMENSIONS.LENGTH },
    { u: "s", dim: null }, { u: "min", dim: null }, { u: "h", dim: null }, { u: "rpm", dim: DIMENSIONS.ROT_SPEED },
    { u: "K", dim: DIMENSIONS.TEMPERATURE }, { u: "°C", dim: DIMENSIONS.TEMPERATURE },
    { u: "°F", dim: DIMENSIONS.TEMPERATURE }, { u: "°R", dim: DIMENSIONS.TEMPERATURE },
    { u: "ΔK", dim: DIMENSIONS.TEMPERATURE }, { u: "Δ°C", dim: DIMENSIONS.TEMPERATURE },
    { u: "Δ°F", dim: DIMENSIONS.TEMPERATURE }, { u: "Δ°R", dim: DIMENSIONS.TEMPERATURE },
    { u: "ms", dim: DIMENSIONS.TIME },
    { u: "Hz", dim: DIMENSIONS.FREQUENCY }, { u: "kHz", dim: DIMENSIONS.FREQUENCY }, { u: "1/s", dim: DIMENSIONS.FREQUENCY },
    { u: "J", dim: DIMENSIONS.ENERGY }, { u: "kJ", dim: DIMENSIONS.ENERGY }, { u: "Btu", dim: DIMENSIONS.ENERGY },
    { u: "kWh", dim: DIMENSIONS.ENERGY }, { u: "ft-lb", dim: DIMENSIONS.ENERGY }, { u: "in-lb", dim: DIMENSIONS.ENERGY },
    { u: "ft-lb_f", dim: DIMENSIONS.ENERGY }, { u: "in-lb_f", dim: DIMENSIONS.ENERGY },
    { u: "N-m", dim: DIMENSIONS.TORQUE }, { u: "N-mm", dim: DIMENSIONS.TORQUE },
    { u: "lb-in", dim: DIMENSIONS.TORQUE }, { u: "lb-ft", dim: DIMENSIONS.TORQUE },
    { u: "lb_f-in", dim: DIMENSIONS.TORQUE }, { u: "lb_f-ft", dim: DIMENSIONS.TORQUE },
    { u: "W", dim: DIMENSIONS.POWER }, { u: "kW", dim: DIMENSIONS.POWER }, { u: "hp", dim: DIMENSIONS.POWER },
    { u: "kJ/s", dim: DIMENSIONS.POWER }, { u: "J/s", dim: DIMENSIONS.POWER },
    { u: "N-m/s", dim: DIMENSIONS.POWER }, { u: "kg*m^2/s^3", dim: DIMENSIONS.POWER },
    { u: "Btu/min", dim: DIMENSIONS.POWER }, { u: "Btu/h", dim: DIMENSIONS.POWER },
    { u: "ft-lb/s", dim: DIMENSIONS.POWER }, { u: "ft-lb/min", dim: DIMENSIONS.POWER },
    { u: "ft-lb_f/s", dim: DIMENSIONS.POWER }, { u: "ft-lb_f/min", dim: DIMENSIONS.POWER },
    { u: "Pa", dim: DIMENSIONS.PRESSURE }, { u: "kPa", dim: DIMENSIONS.PRESSURE },
    { u: "MPa", dim: DIMENSIONS.PRESSURE }, { u: "GPa", dim: DIMENSIONS.MODULUS },
    { u: "bar", dim: DIMENSIONS.PRESSURE }, { u: "psi", dim: DIMENSIONS.PRESSURE }, { u: "psf", dim: DIMENSIONS.PRESSURE },
    { u: "ksi", dim: DIMENSIONS.PRESSURE }, { u: "N/m^2", dim: DIMENSIONS.PRESSURE },
    { u: "kN/m^2", dim: DIMENSIONS.PRESSURE }, { u: "N/mm^2", dim: DIMENSIONS.PRESSURE },
    { u: "N/m", dim: DIMENSIONS.STIFFNESS }, { u: "N/mm", dim: DIMENSIONS.STIFFNESS },
    { u: "kN/m", dim: DIMENSIONS.STIFFNESS }, { u: "kgf/mm", dim: DIMENSIONS.STIFFNESS },
    { u: "lb/in", dim: DIMENSIONS.STIFFNESS }, { u: "lb/ft", dim: DIMENSIONS.STIFFNESS },
    { u: "kip/in", dim: DIMENSIONS.STIFFNESS },
    { u: "m/s^2", dim: DIMENSIONS.ACCELERATION }, { u: "ft/s^2", dim: DIMENSIONS.ACCELERATION },
    { u: "in/s^2", dim: DIMENSIONS.ACCELERATION },
    { u: "m^3", dim: DIMENSIONS.VOLUME }, { u: "L", dim: DIMENSIONS.VOLUME }, { u: "gal", dim: DIMENSIONS.VOLUME }, { u: "ft^3", dim: DIMENSIONS.VOLUME },
    { u: "m^3/kg", dim: DIMENSIONS.VOLUME }, { u: "ft^3/lbm", dim: DIMENSIONS.VOLUME },
    { u: "m^3/s", dim: DIMENSIONS.VOLUME_FLOW }, { u: "m^3/h", dim: DIMENSIONS.VOLUME_FLOW },
    { u: "L/s", dim: DIMENSIONS.VOLUME_FLOW }, { u: "L/h", dim: DIMENSIONS.VOLUME_FLOW },
    { u: "cfm", dim: DIMENSIONS.VOLUME_FLOW }, { u: "gpm", dim: DIMENSIONS.VOLUME_FLOW }, { u: "ft^3/s", dim: DIMENSIONS.VOLUME_FLOW },
    { u: "kg/m^3", dim: DIMENSIONS.DENSITY }, { u: "lb/ft^3", dim: DIMENSIONS.DENSITY }, { u: "lbm/ft^3", dim: DIMENSIONS.DENSITY },
    { u: "kg/s", dim: DIMENSIONS.MASS_FLOW }, { u: "kg/min", dim: DIMENSIONS.MASS_FLOW },
    { u: "kg/h", dim: DIMENSIONS.MASS_FLOW }, { u: "g/s", dim: DIMENSIONS.MASS_FLOW },
    { u: "lb/s", dim: DIMENSIONS.MASS_FLOW }, { u: "lb/min", dim: DIMENSIONS.MASS_FLOW }, { u: "lb/h", dim: DIMENSIONS.MASS_FLOW },
    { u: "lb_m/s", dim: DIMENSIONS.MASS_FLOW }, { u: "lb_m/min", dim: DIMENSIONS.MASS_FLOW }, { u: "lb_m/h", dim: DIMENSIONS.MASS_FLOW },
    { u: "J/kg", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "kJ/kg", dim: DIMENSIONS.SPECIFIC_ENERGY },
    { u: "Btu/lb", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "Btu/lb_m", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "Btu/lbm", dim: DIMENSIONS.SPECIFIC_ENERGY },
    { u: "kJ/kg-ΔK", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "Btu/(lb*Δ°F)", dim: DIMENSIONS.SPECIFIC_ENERGY }
  ];

  const bags = registeredUnits.map(({ u, dim }) => ({ u, dim, bag: getUnitAtomBag(u, dim) }));

  for (let i = 0; i < bags.length; i++) {
    for (let j = i + 1; j < bags.length; j++) {
      if (isDimEqual(bags[i].bag.dimMap, bags[j].bag.dimMap)) {
        const r = bags[i].bag.scale / bags[j].bag.scale;
        if (r > 0) {
          ratios.add(parseFloat(r.toPrecision(6)));
          ratios.add(parseFloat((1 / r).toPrecision(6)));
        }
      }
    }
  }

  // Register exact affine temperature offsets and standard gravitational equivalents (gc)
  for (const meta of Object.values(BASE_UNITS)) {
    if (meta.offset) ratios.add(meta.offset);
  }
  [32.1740, 386.089, 9.80665, 386.0886, 32.174049].forEach(gc => {
    ratios.add(parseFloat(gc.toPrecision(6)));
    ratios.add(parseFloat((1 / gc).toPrecision(6)));
  });

  // Every same-dimension pair of registry units, derived from BASE_UNITS so a newly
  // registered unit is canonical against its dimensional peers without editing a list.
  const peers = Object.values(BASE_UNITS).map(m => getUnitAtomBag(m.symbol));
  for (let i = 0; i < peers.length; i++) {
    for (let j = i + 1; j < peers.length; j++) {
      if (!isDimEqual(peers[i].dimMap, peers[j].dimMap)) continue;
      const r = peers[i].scale / peers[j].scale;
      if (r > 0 && Number.isFinite(r)) {
        ratios.add(parseFloat(r.toPrecision(6)));
        ratios.add(parseFloat((1 / r).toPrecision(6)));
      }
    }
  }

  cachedRatios = Array.from(ratios);
  return cachedRatios;
}

/**
 * Verifies whether a displayed conversion scalar is either a pure metric power
 * of 10 or the exact scale ratio between two registered units of the same dimension.
 */
export function isCanonicalScaleFactor(val) {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return false;

  const log10 = Math.log10(val);
  if (Math.abs(log10 - Math.round(log10)) < 1e-6) return true;

  for (const ratio of getRegisteredPairwiseRatios()) {
    if (Math.abs(val - ratio) / ratio < 1e-4) return true;
  }
  return false;
}