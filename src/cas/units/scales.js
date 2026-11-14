/**
 * src/cas/units/scales.js
 * Single Source of Truth for canonical unit conversion factors, 6-sig-fig
 * scale formatting (without 3-decimal cap), and factor-label decomposition.
 */

import {
  BASE_UNITS,
  parseUnitToSemanticAST,
  getUnitAtomBag,
  isDimEqual,
  unitToTex,
  unitToCancelledTex
} from "./definitions.js";
import { addSeparators, DIMENSIONS } from "../../core/dimensions.js";

/**
 * Formats scale conversion factors to 6 significant figures without the
 * 3-decimal-place truncation cap used by measured variables.
 */
export function fmtScale(n, isLatex = true) {
  if (n === undefined || n === null || isNaN(n)) return "";
  if (Number.isInteger(n)) return addSeparators(n.toString(), isLatex);

  const val = parseFloat(n.toPrecision(6));
  if (Number.isInteger(val)) return addSeparators(val.toString(), isLatex);

  const str = Math.abs(val) < 1e-4 && Math.abs(val) > 0
    ? val.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")
    : val.toString();

  return addSeparators(str, isLatex);
}

function splitRateParts(unitStr) {
  if (!unitStr || unitStr.includes("(")) return null;
  const parts = unitStr.split("/");
  if (parts.length !== 2) return null;
  return { num: parts[0].trim(), den: parts[1].trim() };
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
          if (numRatio > 1) {
            steps.push(` \\cdot ${fmtScale(numRatio)} \\, \\cfrac{${tNTex}}{${fNTex}}`);
            scalars.push(parseFloat(numRatio.toPrecision(6)));
          } else {
            const inv = 1 / numRatio;
            steps.push(` \\cdot \\cfrac{${tNTex}}{${fmtScale(inv)} \\, ${fNTex}}`);
            scalars.push(parseFloat(inv.toPrecision(6)));
          }
        }

        if (Math.abs(denRatio - 1) >= 1e-6) {
          const fDTex = unitToCancelledTex(fParts.den, false, fromDim, "whole");
          const tDTex = unitToTex(tParts.den, false, toDim);
          if (denRatio > 1) {
            steps.push(` \\cdot \\cfrac{${fDTex}}{${fmtScale(denRatio)} \\, ${tDTex}}`);
            scalars.push(parseFloat(denRatio.toPrecision(6)));
          } else {
            const inv = 1 / denRatio;
            steps.push(` \\cdot ${fmtScale(inv)} \\, \\cfrac{${fDTex}}{${tDTex}}`);
            scalars.push(parseFloat(inv.toPrecision(6)));
          }
        }

        if (steps.length > 0) {
          return { tex: steps.join(""), scalar: scalars[0] ?? null, scalars, isDecomposed: true };
        }
      }
    }
  }

  const fromTex = unitToCancelledTex(fromUnit, false, fromDim, cancelMode);
  const toTex = unitToTex(toUnit, false, toDim);

  if (ratio > 1) {
    const s = parseFloat(ratio.toPrecision(6));
    return {
      tex: ` \\cdot ${fmtScale(ratio)} \\, \\cfrac{${toTex}}{${fromTex}}`,
      scalar: s,
      scalars: [s],
      isDecomposed: false
    };
  }
  const inv = 1 / ratio;
  const s = parseFloat(inv.toPrecision(6));
  return {
    tex: ` \\cdot \\cfrac{${toTex}}{${fmtScale(inv)} \\, ${fromTex}}`,
    scalar: s,
    scalars: [s],
    isDecomposed: false
  };
}

/**
 * Resolves a component mismatch between two units in a dimensionless ratio
 * (e.g. Btu/h vs Btu/min, or m^3/h vs m^3/s) directly from their semantic ASTs.
 */
export function formatComponentMismatch(unitA, unitB, dimA = null, dimB = null) {
  const astA = parseUnitToSemanticAST(unitA, dimA);
  const astB = parseUnitToSemanticAST(unitB, dimB);

  for (const fA of astA) {
    const baseMetaA = BASE_UNITS[fA.base];
    if (!baseMetaA) continue;

    const matchB = astB.find(fB => {
      const baseMetaB = BASE_UNITS[fB.base];
      return baseMetaB && baseMetaB.dim === baseMetaA.dim && fB.power === fA.power &&
        (fA.base !== fB.base || fA.prefix !== fB.prefix);
    });

    if (matchB) {
      const uStrA = atomToUnitString(fA);
      const uStrB = atomToUnitString(matchB);
      const sA = getUnitAtomBag(uStrA).scale;
      const sB = getUnitAtomBag(uStrB).scale;
      const ratio = sA / sB;

      if (Math.abs(ratio - 1) < 1e-6) continue;

      const fromAtom = fA.power < 0 ? uStrA : uStrB;
      const toAtom = fA.power < 0 ? uStrB : uStrA;
      const effRatio = fA.power < 0 ? (sA / sB) : (sB / sA);

      if (effRatio > 1) {
        return {
          tex: ` \\cdot ${fmtScale(effRatio)} \\, \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{\\cancel{${unitToTex(toAtom)}}}`,
          scalar: parseFloat(effRatio.toPrecision(6))
        };
      }
      const inv = 1 / effRatio;
      return {
        tex: ` \\cdot \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{${fmtScale(inv)} \\, \\cancel{${unitToTex(toAtom)}}}`,
        scalar: parseFloat(inv.toPrecision(6))
      };
    }
  }

  return formatPairConversion(unitA, unitB, dimA, "whole");
}

function atomToUnitString(atom) {
  const prefixMap = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
  const p = atom.prefix ? (prefixMap[atom.prefix] || "") : "";
  const sym = BASE_UNITS[atom.base]?.symbol || atom.base;
  return `${p}${sym}`;
}

/**
 * Decomposes a compound expression conversion (e.g. (lb/min)/(Btu/h) -> kg/kWh)
 * into canonical atomic factor-label steps attached in-situ to each token.
 */
export function buildCompoundTokenConversions(tokenEntries, targetUnit, targetDim = null) {
  const targetAst = parseUnitToSemanticAST(targetUnit, targetDim);
  const conversionsByToken = {};
  const scalars = [];
  const usedTargetIndices = new Set();

  const targetHasEnergy = targetAst.some(a => BASE_UNITS[a.base]?.dim === "E");
  const targetPrefersBtu = targetAst.some(a => a.base === "Btu");

  // Flatten all source atoms, expanding Power units (W, kW, hp) when targeting Energy/Time
  const sourceAtoms = [];
  for (const entry of tokenEntries) {
    let workingUnit = entry.uName;
    if (targetHasEnergy && (workingUnit === "W" || workingUnit === "kW" || workingUnit === "hp")) {
      if (workingUnit === "W") {
        workingUnit = "J/s";
      } else if (workingUnit === "kW") {
        workingUnit = "kJ/s";
      } else if (workingUnit === "hp") {
        const rateTarget = targetPrefersBtu ? "Btu/min" : "kJ/s";
        const r = getUnitAtomBag("hp").scale / getUnitAtomBag(rateTarget).scale;
        if (!conversionsByToken[entry.tok]) conversionsByToken[entry.tok] = [];
        conversionsByToken[entry.tok].push(` \\cdot ${fmtScale(r)} \\, \\cfrac{${unitToTex(rateTarget, true)}}{\\cancel{\\text{hp}}}`);
        scalars.push(parseFloat(r.toPrecision(6)));
        workingUnit = rateTarget;
      }
    }

    const ast = parseUnitToSemanticAST(workingUnit, entry.dim);
    ast.forEach(atom => {
      sourceAtoms.push({
        tok: entry.tok,
        atom,
        exp: entry.exp,
        netPower: atom.power * entry.exp,
        dim: BASE_UNITS[atom.base]?.dim || atom.base
      });
    });
  }

  // 0. Pair reciprocal Frequency (Hz/kHz/MHz) <-> Time (s/ms/min/h) via 1 Hz * 1 s = 1
  for (const src of sourceAtoms) {
    if (src.matched || (src.dim !== "Freq" && src.dim !== "T")) continue;
    const wantedDim = src.dim === "Freq" ? "T" : "Freq";
    const tIdx = targetAst.findIndex((tAtom, idx) => {
      if (usedTargetIndices.has(idx)) return false;
      const tDim = BASE_UNITS[tAtom.base]?.dim || tAtom.base;
      const isRecipPair =
        (src.dim === "Freq" && src.atom.base === "hertz" && tDim === "T") ||
        (src.dim === "T" && tAtom.base === "hertz");
      return isRecipPair && tDim === wantedDim && Math.sign(tAtom.power) === Math.sign(src.netPower);
    });

    if (tIdx >= 0) {
      usedTargetIndices.add(tIdx);
      src.matched = true;
      const tAtom = targetAst[tIdx];
      const srcStr = atomToUnitString(src.atom);
      const tgtStr = atomToUnitString(tAtom);
      const sSrc = getUnitAtomBag(srcStr).scale;
      const sTgt = getUnitAtomBag(tgtStr).scale;
      const prod = sSrc * sTgt;

      if (!conversionsByToken[src.tok]) conversionsByToken[src.tok] = [];
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

  // 1. Pair source atoms with matching target atoms by base dimension
  for (const src of sourceAtoms) {
    if (src.matched) continue;
    const tIdx = targetAst.findIndex((tAtom, idx) => {
      if (usedTargetIndices.has(idx)) return false;
      const tDim = BASE_UNITS[tAtom.base]?.dim || tAtom.base;
      return tDim === src.dim && Math.sign(tAtom.power) === Math.sign(src.netPower);
    });

    if (tIdx >= 0) {
      usedTargetIndices.add(tIdx);
      const tAtom = targetAst[tIdx];
      const srcStr = atomToUnitString(src.atom);
      const tgtStr = atomToUnitString(tAtom);
      const sSrc = getUnitAtomBag(srcStr).scale;
      const sTgt = getUnitAtomBag(tgtStr).scale;
      const ratio = sSrc / sTgt;

      if (Math.abs(ratio - 1) > 1e-6) {
        if (!conversionsByToken[src.tok]) conversionsByToken[src.tok] = [];
        const sVal = ratio > 1 ? ratio : (1 / ratio);
        scalars.push(parseFloat(sVal.toPrecision(6)));

        if (src.atom.power > 0) {
          if (ratio > 1) {
            conversionsByToken[src.tok].push(` \\cdot ${fmtScale(ratio)} \\, \\cfrac{${unitToTex(tgtStr)}}{\\cancel{${unitToTex(srcStr)}}}`);
          } else {
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{${unitToTex(tgtStr)}}{${fmtScale(1 / ratio)} \\, \\cancel{${unitToTex(srcStr)}}}`);
          }
        } else {
          if (ratio > 1) {
            conversionsByToken[src.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(srcStr)}}}{${fmtScale(ratio)} \\, ${unitToTex(tgtStr)}}`);
          } else {
            conversionsByToken[src.tok].push(` \\cdot ${fmtScale(1 / ratio)} \\, \\cfrac{\\cancel{${unitToTex(srcStr)}}}{${unitToTex(tgtStr)}}`);
          }
        }
      }
      src.matched = true;
    }
  }

  // 2. Pair remaining unmatched source atoms that cancel each other across tokens (e.g. min vs h)
  const unmatched = sourceAtoms.filter(s => !s.matched);
  for (let i = 0; i < unmatched.length; i++) {
    const a = unmatched[i];
    if (a.matched) continue;
    const partner = unmatched.find((b, j) =>
      j > i && !b.matched && b.dim === a.dim && a.netPower + b.netPower === 0
    );
    if (partner) {
      a.matched = true;
      partner.matched = true;
      const strA = atomToUnitString(a.atom);
      const strB = atomToUnitString(partner.atom);
      const sA = getUnitAtomBag(strA).scale;
      const sB = getUnitAtomBag(strB).scale;
      const ratio = sA / sB;

      if (Math.abs(ratio - 1) > 1e-6) {
        if (!conversionsByToken[a.tok]) conversionsByToken[a.tok] = [];
        const sVal = ratio > 1 ? ratio : (1 / ratio);
        scalars.push(parseFloat(sVal.toPrecision(6)));

        if (a.atom.power < 0) {
          if (ratio < 1) {
            conversionsByToken[a.tok].push(` \\cdot ${fmtScale(1 / ratio)} \\, \\cfrac{\\cancel{${unitToTex(strA)}}}{\\cancel{${unitToTex(strB)}}}`);
          } else {
            conversionsByToken[a.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(strA)}}}{${fmtScale(ratio)} \\, \\cancel{${unitToTex(strB)}}}`);
          }
        } else {
          if (ratio > 1) {
            conversionsByToken[a.tok].push(` \\cdot ${fmtScale(ratio)} \\, \\cfrac{\\cancel{${unitToTex(strB)}}}{\\cancel{${unitToTex(strA)}}}`);
          } else {
            conversionsByToken[a.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(strB)}}}{${fmtScale(1 / ratio)} \\, \\cancel{${unitToTex(strA)}}}`);
          }
        }
      }
    }
  }

  return { conversionsByToken, scalars };
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
    { u: "g", dim: DIMENSIONS.MASS }, { u: "kg", dim: DIMENSIONS.MASS }, { u: "lb", dim: DIMENSIONS.MASS },
    { u: "lbm", dim: DIMENSIONS.MASS },
    { u: "N", dim: DIMENSIONS.FORCE }, { u: "kN", dim: DIMENSIONS.FORCE }, { u: "lb", dim: DIMENSIONS.FORCE },
    { u: "lbf", dim: DIMENSIONS.FORCE }, { u: "kgf", dim: DIMENSIONS.FORCE }, { u: "kip", dim: DIMENSIONS.FORCE },
    { u: "m", dim: DIMENSIONS.LENGTH }, { u: "mm", dim: DIMENSIONS.LENGTH }, { u: "cm", dim: DIMENSIONS.LENGTH },
    { u: "in", dim: DIMENSIONS.LENGTH }, { u: "ft", dim: DIMENSIONS.LENGTH }, { u: "yd", dim: DIMENSIONS.LENGTH },
    { u: "s", dim: null }, { u: "min", dim: null }, { u: "h", dim: null }, { u: "rpm", dim: DIMENSIONS.ROT_SPEED },
    { u: "K", dim: DIMENSIONS.TEMPERATURE }, { u: "°C", dim: DIMENSIONS.TEMPERATURE },
    { u: "°F", dim: DIMENSIONS.TEMPERATURE }, { u: "°R", dim: DIMENSIONS.TEMPERATURE },
    { u: "ms", dim: DIMENSIONS.TIME },
    { u: "Hz", dim: DIMENSIONS.FREQUENCY }, { u: "kHz", dim: DIMENSIONS.FREQUENCY }, { u: "1/s", dim: DIMENSIONS.FREQUENCY },
    { u: "J", dim: DIMENSIONS.ENERGY }, { u: "kJ", dim: DIMENSIONS.ENERGY }, { u: "Btu", dim: DIMENSIONS.ENERGY },
    { u: "kWh", dim: DIMENSIONS.ENERGY }, { u: "ft-lb", dim: DIMENSIONS.ENERGY }, { u: "in-lb", dim: DIMENSIONS.ENERGY },
    { u: "N-m", dim: DIMENSIONS.TORQUE }, { u: "N-mm", dim: DIMENSIONS.TORQUE },
    { u: "lb-in", dim: DIMENSIONS.TORQUE }, { u: "lb-ft", dim: DIMENSIONS.TORQUE },
    { u: "W", dim: DIMENSIONS.POWER }, { u: "kW", dim: DIMENSIONS.POWER }, { u: "hp", dim: DIMENSIONS.POWER },
    { u: "kJ/s", dim: DIMENSIONS.POWER }, { u: "J/s", dim: DIMENSIONS.POWER },
    { u: "Btu/min", dim: DIMENSIONS.POWER }, { u: "Btu/h", dim: DIMENSIONS.POWER },
    { u: "ft-lb/s", dim: DIMENSIONS.POWER }, { u: "ft-lb/min", dim: DIMENSIONS.POWER },
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
    { u: "m^3", dim: DIMENSIONS.VOLUME }, { u: "L", dim: DIMENSIONS.VOLUME }, { u: "ft^3", dim: DIMENSIONS.VOLUME },
    { u: "m^3/s", dim: DIMENSIONS.VOLUME_FLOW }, { u: "m^3/h", dim: DIMENSIONS.VOLUME_FLOW },
    { u: "L/h", dim: DIMENSIONS.VOLUME_FLOW }, { u: "cfm", dim: DIMENSIONS.VOLUME_FLOW },
    { u: "kg/s", dim: DIMENSIONS.MASS_FLOW }, { u: "kg/min", dim: DIMENSIONS.MASS_FLOW },
    { u: "kg/h", dim: DIMENSIONS.MASS_FLOW }, { u: "g/s", dim: DIMENSIONS.MASS_FLOW },
    { u: "lb/s", dim: DIMENSIONS.MASS_FLOW }, { u: "lb/min", dim: DIMENSIONS.MASS_FLOW }, { u: "lb/h", dim: DIMENSIONS.MASS_FLOW },
    { u: "kJ/kg", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "Btu/lb", dim: DIMENSIONS.SPECIFIC_ENERGY },
    { u: "kJ/kg-K", dim: DIMENSIONS.SPECIFIC_ENERGY }, { u: "Btu/(lb*F)", dim: DIMENSIONS.SPECIFIC_ENERGY }
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

  // Register exact affine temperature offsets
  for (const meta of Object.values(BASE_UNITS)) {
    if (meta.offset) ratios.add(meta.offset);
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
