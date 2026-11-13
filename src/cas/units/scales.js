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

/**
 * Formats a single-step conversion factor between two units sharing a dimension.
 * Enforces the "Omit 1" rule and places scalar multipliers outside unit fractions.
 */
export function formatPairConversion(fromUnit, toUnit, dim = null, cancelMode = "whole") {
  const fromScale = getUnitAtomBag(fromUnit, dim).scale;
  const toScale = getUnitAtomBag(toUnit, dim).scale;
  const ratio = fromScale / toScale;

  if (Math.abs(ratio - 1) < 1e-6) return "";

  const fromTex = unitToCancelledTex(fromUnit, false, dim, cancelMode);
  const toTex = unitToTex(toUnit, false, dim);

  if (ratio > 1) {
    return ` \\cdot ${fmtScale(ratio)} \\, \\cfrac{${toTex}}{${fromTex}}`;
  }
  return ` \\cdot \\cfrac{${toTex}}{${fmtScale(1 / ratio)} \\, ${fromTex}}`;
}

/**
 * Resolves a component mismatch between two units in a dimensionless ratio
 * (e.g. Btu/h vs Btu/min, or m^3/h vs m^3/s) directly from their semantic ASTs.
 * Returns { factorTex, preferToken }: the conversion LaTeX and which token holds it.
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

      // Positive power: uA -> uB; Negative power (in denominator): uB/uA cancels 1/uA -> 1/uB
      const fromAtom = fA.power < 0 ? uStrA : uStrB;
      const toAtom = fA.power < 0 ? uStrB : uStrA;
      const effRatio = fA.power < 0 ? (sA / sB) : (sB / sA);

      if (effRatio > 1) {
        return ` \\cdot ${fmtScale(effRatio)} \\, \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{\\cancel{${unitToTex(toAtom)}}}`;
      }
      return ` \\cdot \\cfrac{\\cancel{${unitToTex(fromAtom)}}}{${fmtScale(1 / effRatio)} \\, \\cancel{${unitToTex(toAtom)}}}`;
    }
  }

  // Fallback to whole-unit ratio if mismatch is across composite atoms
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
export function buildCompoundTokenConversions(tokenEntries, targetUnit) {
  const targetAst = parseUnitToSemanticAST(targetUnit);
  const result = {};
  const usedTargetIndices = new Set();

  // Flatten all source atoms with their net formula exponent
  const sourceAtoms = [];
  for (const entry of tokenEntries) {
    const ast = parseUnitToSemanticAST(entry.uName, entry.dim);
    ast.forEach(atom => {
      sourceAtoms.push({
        tok: entry.tok,
        atom,
        netPower: atom.power * entry.exp,
        dim: BASE_UNITS[atom.base]?.dim || atom.base
      });
    });
  }

  // 1. Pair source atoms with matching target atoms by base dimension
  for (const src of sourceAtoms) {
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
        if (!result[src.tok]) result[src.tok] = [];
        // If src is in token's numerator (atom.power > 0), multiply by tgt/src
        // If src is in token's denominator (atom.power < 0), multiply by src/tgt
        if (src.atom.power > 0) {
          if (ratio > 1) {
            result[src.tok].push(` \\cdot ${fmtScale(ratio)} \\, \\cfrac{${unitToTex(tgtStr)}}{\\cancel{${unitToTex(srcStr)}}}`);
          } else {
            result[src.tok].push(` \\cdot \\cfrac{${unitToTex(tgtStr)}}{${fmtScale(1 / ratio)} \\, \\cancel{${unitToTex(srcStr)}}}`);
          }
        } else {
          if (ratio > 1) {
            result[src.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(srcStr)}}}{${fmtScale(ratio)} \\, ${unitToTex(tgtStr)}}`);
          } else {
            result[src.tok].push(` \\cdot ${fmtScale(1 / ratio)} \\, \\cfrac{\\cancel{${unitToTex(srcStr)}}}{${unitToTex(tgtStr)}}`);
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
        if (!result[a.tok]) result[a.tok] = [];
        if (a.atom.power < 0) {
          if (ratio < 1) {
            result[a.tok].push(` \\cdot ${fmtScale(1 / ratio)} \\, \\cfrac{\\cancel{${unitToTex(strA)}}}{\\cancel{${unitToTex(strB)}}}`);
          } else {
            result[a.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(strA)}}}{${fmtScale(ratio)} \\, \\cancel{${unitToTex(strB)}}}`);
          }
        } else {
          if (ratio > 1) {
            result[a.tok].push(` \\cdot ${fmtScale(ratio)} \\, \\cfrac{\\cancel{${unitToTex(strB)}}}{\\cancel{${unitToTex(strA)}}}`);
          } else {
            result[a.tok].push(` \\cdot \\cfrac{\\cancel{${unitToTex(strB)}}}{${fmtScale(1 / ratio)} \\, \\cancel{${unitToTex(strA)}}}`);
          }
        }
      }
    }
  }

  return result;
}

// ============================================================================
// SINGLE-SOURCE-OF-TRUTH CANONICAL RATIO REGISTRY (FOR AUTOMATED VERIFICATION)
// ============================================================================

let cachedRatios = null;

function getRegisteredPairwiseRatios() {
  if (cachedRatios) return cachedRatios;
  const ratios = new Set();

  // Build representative registered unit strings from BASE_UNITS + common compounds
  const registeredUnits = [
    "g", "kg", "lb", "lbm", "lbf", "N", "kN", "kgf", "kip",
    "m", "mm", "cm", "in", "ft", "yd",
    "s", "min", "h", "rpm",
    "K", "°C", "°F", "°R",
    "J", "kJ", "Btu", "kWh", "ft-lb",
    "W", "kW", "hp", "kJ/s", "J/s", "Btu/min", "Btu/h", "ft-lb/s", "ft-lb/min",
    "Pa", "kPa", "MPa", "bar", "psi", "psf", "ksi", "N/m^2", "kN/m^2", "N/mm^2",
    "m^3", "L", "ft^3", "m^3/s", "m^3/h", "L/h", "cfm",
    "kg/s", "kg/min", "kg/h", "g/s", "lb/s", "lb/min", "lb/h",
    "kJ/kg", "Btu/lb", "kJ/kg-K", "Btu/(lb*F)"
  ];

  const bags = registeredUnits.map(u => {
    const dimHint = (u.includes("lb/") || u.includes("/lb")) ? DIMENSIONS.MASS_FLOW : null;
    return { u, bag: getUnitAtomBag(u, dimHint) };
  });

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
