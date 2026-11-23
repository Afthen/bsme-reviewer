/**
 * src/cas/units/definitions.js
 * Semantic Unit AST Registry with Explicit Force/Mass Distinction,
 * Dimension-Aware Token Resolution, and Beautification Translation Layer.
 */

import { parseUnitAST, flattenUnitAST } from "./ast.js";
import { DIMENSIONS } from "../../core/dimensions.js";

export { DIMENSIONS };

export const PREFIXES = Object.freeze({
  "p": { name: "pico", scale: 1e-12 },
  "n": { name: "nano", scale: 1e-9 },
  "u": { name: "micro", scale: 1e-6 },
  "m": { name: "milli", scale: 1e-3 },
  "c": { name: "centi", scale: 1e-2 },
  "d": { name: "deci", scale: 1e-1 },
  "k": { name: "kilo", scale: 1e3 },
  "M": { name: "mega", scale: 1e6 },
  "G": { name: "giga", scale: 1e9 }
});

/**
 * SSOT: Unified Base Units and Dimensional Vectors.
 * This prevents "Dimensionless Orphans" by forcing every unit to declare its 7D vector.
 */
const RAW_BASE_UNITS = {
  "gram":           { baseScale: 0.001, symbol: "g", dimMap: { M: 1 }, forceCompanion: "gram_force" },
  "gram_force":     { baseScale: 0.001 * 9.80665, symbol: "g_f", dimMap: { M: 1, L: 1, T: -2 }, massCompanion: "gram" },
  "pound_mass":     { baseScale: 0.45359237, symbol: "lb_m", dimMap: { M: 1 }, forceCompanion: "pound_force" },
  "pound_force":    { baseScale: 0.45359237 * 9.80665, symbol: "lb_f", dimMap: { M: 1, L: 1, T: -2 }, massCompanion: "pound_mass" },
  "kilogram_force": { baseScale: 9.80665, symbol: "kg_f", dimMap: { M: 1, L: 1, T: -2 }, massCompanion: "gram" },
  "newton":         { baseScale: 1.0, symbol: "N", dimMap: { M: 1, L: 1, T: -2 } },
  "meter":          { baseScale: 1.0, symbol: "m", dimMap: { L: 1 } },
  "second":         { baseScale: 1.0, symbol: "s", dimMap: { T: 1 } },
  "percent":        { baseScale: 0.01, symbol: "%", dimMap: { Pct: 1 } },
  "Kelvin":         { baseScale: 1.0, symbol: "K", dimMap: { Th: 1 } },
  "Celsius":        { baseScale: 1.0, symbol: "°C", dimMap: { Th: 1 }, offset: 273.15, absCompanion: "Kelvin" },
  "Fahrenheit":     { baseScale: 5/9, symbol: "°F", dimMap: { Th: 1 }, offset: 459.67, absCompanion: "Rankine" },
  "Rankine":        { baseScale: 5/9, symbol: "°R", dimMap: { Th: 1 } },
  "Btu":            { baseScale: 1055.056, symbol: "Btu", dimMap: { M: 1, L: 2, T: -2 } },
  "Joule":          { baseScale: 1.0, symbol: "J", dimMap: { M: 1, L: 2, T: -2 } },
  "Watt":           { baseScale: 1.0, symbol: "W", dimMap: { M: 1, L: 2, T: -3 } },
  "Pascal":         { baseScale: 1.0, symbol: "Pa", dimMap: { M: 1, L: -1, T: -2 } },
  "teeth":          { baseScale: 1.0, symbol: "teeth", dimMap: { C: 1 } },
  "rad":            { baseScale: 1.0, symbol: "rad", dimMap: { Ang: 1 } },
  "rev":            { baseScale: 1.0, symbol: "rev", dimMap: { C: 1 } },
  "deg":            { baseScale: Math.PI / 180, symbol: "°", dimMap: { Ang: 1 } },
  "minute":         { baseScale: 60.0, symbol: "min", dimMap: { T: 1 } },
  "hour":           { baseScale: 3600.0, symbol: "h", dimMap: { T: 1 } },
  "inch":           { baseScale: 0.0254, symbol: "in", dimMap: { L: 1 } },
  "foot":           { baseScale: 0.3048, symbol: "ft", dimMap: { L: 1 } },
  "yard":           { baseScale: 0.9144, symbol: "yd", dimMap: { L: 1 } },
  "horsepower":     { baseScale: 745.69987, symbol: "hp", dimMap: { M: 1, L: 2, T: -3 } },
  "kWh":            { baseScale: 3600000.0, symbol: "kWh", dimMap: { M: 1, L: 2, T: -2 } },
  "bar":            { baseScale: 100000.0, symbol: "bar", dimMap: { M: 1, L: -1, T: -2 } },
  "litre":          { baseScale: 0.001, symbol: "L", dimMap: { L: 3 } },
  "gallon":         { baseScale: 0.003785411784, symbol: "gal", dimMap: { L: 3 } },
  "rpm":            { baseScale: 1/60, symbol: "rpm", dimMap: { T: -1 } },
  "hertz":          { baseScale: 1.0, symbol: "Hz", dimMap: { T: -1 } },
  "cfm":            { baseScale: 0.3048**3 / 60, symbol: "cfm", dimMap: { L: 3, T: -1 } },
  "gpm":            { baseScale: 0.003785411784 / 60, symbol: "gpm", dimMap: { L: 3, T: -1 } }
};

// Derive delta twins (zero offset, same linear scale) programmatically for every temperature scale
const BUILT_UNITS = { ...RAW_BASE_UNITS };
for (const [key, meta] of Object.entries(RAW_BASE_UNITS)) {
  if (!meta.dimMap?.Th) continue;
  const deltaKey = `${key}_delta`;
  const absBase = meta.absCompanion || key;
  BUILT_UNITS[key] = Object.freeze({
    ...meta,
    deltaCompanion: deltaKey,
    absCompanion: absBase
  });
  BUILT_UNITS[deltaKey] = Object.freeze({
    baseScale: meta.baseScale,
    symbol: `Δ${meta.symbol}`,
    dimMap: { ...meta.dimMap },
    isDelta: true,
    pointCompanion: key,
    absCompanion: `${absBase}_delta`
  });
}

export const BASE_UNITS = Object.freeze(BUILT_UNITS);

export const SUBSTITUTION_GRAPH = Object.freeze({
  "Watt": { num: ["Joule"], den: ["second"] },
  "Joule": { num: ["newton", "meter"], den: [] },
  "newton": { num: ["gram", "meter"], den: ["second", "second"], scale: 0.001 },
  "Pascal": { num: ["newton"], den: ["meter", "meter"] },
  "horsepower": { num: ["foot", "pound_force"], den: ["second"], scale: 550 },
  "psi": { num: ["pound_force"], den: ["inch", "inch"] },
  "psf": { num: ["pound_force"], den: ["foot", "foot"] },
  "ksi": { num: ["kilo-pound_force"], den: ["inch", "inch"] }
});

function resolveBaseStem(stem, dimension = null) {
  if (stem === "hr") return { prefix: null, base: "hour" };
  if (stem === "kip" || stem === "kips" || stem === "klb") return { prefix: "kilo", base: "pound_force" };
  if (stem === "kg") return { prefix: "kilo", base: "gram" };
  if (stem === "g") return { prefix: null, base: "gram" };
  if (stem === "N") return { prefix: null, base: "newton" };

  if (stem === "lb") {
    if (
      dimension === DIMENSIONS.MASS ||
      dimension === DIMENSIONS.MASS_FLOW ||
      dimension === DIMENSIONS.DENSITY ||
      dimension === DIMENSIONS.SPECIFIC_ENERGY ||
      dimension === DIMENSIONS.SPECIFIC_CONSUMPTION
    ) {
      return { prefix: null, base: "pound_mass" };
    }
    return { prefix: null, base: "pound_force" };
  }

  const foundExact = Object.keys(BASE_UNITS).find(
    bKey => !BASE_UNITS[bKey].isDelta && (bKey === stem || BASE_UNITS[bKey].symbol === stem)
  );
  if (foundExact) return { prefix: null, base: foundExact };

  for (const [pCode, pMeta] of Object.entries(PREFIXES)) {
    if (stem.startsWith(pCode) && stem.length > pCode.length) {
      const possibleBase = stem.slice(pCode.length);
      if (possibleBase === "lb") {
        const lbBase = dimension === DIMENSIONS.MASS ? "pound_mass" : "pound_force";
        return { prefix: pMeta.name, base: lbBase };
      }
      const foundBase = Object.keys(BASE_UNITS).find(
        bKey => !BASE_UNITS[bKey].isDelta && !BASE_UNITS[bKey].dimMap?.Th && (bKey === possibleBase || BASE_UNITS[bKey].symbol === possibleBase)
      );
      if (foundBase) return { prefix: pMeta.name, base: foundBase };
    }
  }

  return null;
}

function resolveTempAtom(body) {
  if (body === "F" || body === "°F") return "Fahrenheit";
  if (body === "C" || body === "°C") return "Celsius";
  if (body === "R" || body === "°R") return "Rankine";
  if (body === "K") return "Kelvin";
  return null;
}

export function resolveUnitToken(tokenBody, dimension = null) {
  if (tokenBody === "%" || tokenBody === "\\%") return { prefix: null, base: "percent" };
  if (tokenBody === "°" || tokenBody === "deg") return { prefix: null, base: "deg" };

  if (tokenBody.startsWith("Δ")) {
    const pointBase = resolveTempAtom(tokenBody.slice(1));
    if (pointBase && BASE_UNITS[pointBase]?.deltaCompanion) {
      return { prefix: null, base: BASE_UNITS[pointBase].deltaCompanion };
    }
    return { prefix: null, base: tokenBody };
  }

  const tempBase = resolveTempAtom(tokenBody);
  if (tempBase) return { prefix: null, base: tempBase };

  // General _m / _f suffix + legacy compact gravitational aliases (lbm, lbf, kgf, gf, klbm, klbf)
  const suffixMatch = tokenBody.match(/^(.+)_(m|f)$/) || tokenBody.match(/^(lb|klb|kg|g)(m|f)$/);
  if (suffixMatch) {
    const [, rawStem, suffix] = suffixMatch;
    const stemDim = suffix === "m" ? DIMENSIONS.MASS : DIMENSIONS.FORCE;
    const resolvedStem = resolveBaseStem(rawStem, stemDim);
    if (resolvedStem && BASE_UNITS[resolvedStem.base]) {
      const baseMeta = BASE_UNITS[resolvedStem.base];
      if (suffix === "m") {
        if (baseMeta.forceCompanion) return resolvedStem;
        if (baseMeta.massCompanion) return { prefix: resolvedStem.prefix, base: baseMeta.massCompanion };
      } else if (suffix === "f") {
        if (baseMeta.massCompanion) return resolvedStem;
        if (baseMeta.forceCompanion) return { prefix: resolvedStem.prefix, base: baseMeta.forceCompanion };
      }
    }
    return { prefix: null, base: tokenBody };
  }

  return resolveBaseStem(tokenBody, dimension) || { prefix: null, base: tokenBody };
}

export function parseUnitToSemanticAST(uName, dimension = null) {
  if (!uName || uName === "dimless" || uName === "ratio") return [];
  if (uName === "psi") return [{ prefix: null, base: "pound_force", power: 1 }, { prefix: null, base: "inch", power: -2 }];
  if (uName === "psf") return [{ prefix: null, base: "pound_force", power: 1 }, { prefix: null, base: "foot", power: -2 }];
  if (uName === "ksi") return [{ prefix: "kilo", base: "pound_force", power: 1 }, { prefix: null, base: "inch", power: -2 }];
  if (uName === "rpm") return [{ prefix: null, base: "rev", power: 1 }, { prefix: null, base: "minute", power: -1 }];
  if (uName === "cfm") return [{ prefix: null, base: "foot", power: 3 }, { prefix: null, base: "minute", power: -1 }];
  if (uName === "gpm") return [{ prefix: null, base: "gallon", power: 1 }, { prefix: null, base: "minute", power: -1 }];

  const ast = parseUnitAST(uName, dimension);
  return flattenUnitAST(ast);
}

export function getUnitOffset(uName, dimension = null) {
  return getUnitAtomBag(uName, dimension).offset;
}

export function getUnitKind(uName, dimension = null) {
  return getUnitAtomBag(uName, dimension).kind;
}

export function getAbsoluteCompanionUnit(uName) {
  const ast = parseUnitToSemanticAST(uName);
  if (ast.length !== 1 || ast[0].power !== 1) return uName;
  const meta = BASE_UNITS[ast[0].base];
  if (!meta?.absCompanion) return uName;
  return BASE_UNITS[meta.absCompanion]?.symbol || uName;
}

export function toDeltaUnit(uName) {
  const ast = parseUnitToSemanticAST(uName);
  if (ast.length !== 1 || ast[0].power !== 1) return uName;
  const meta = BASE_UNITS[ast[0].base];
  if (meta?.isDelta) return meta.symbol;
  if (meta?.deltaCompanion) return BASE_UNITS[meta.deltaCompanion]?.symbol || uName;
  return uName;
}

export function toPointUnit(uName) {
  const ast = parseUnitToSemanticAST(uName);
  if (ast.length !== 1 || ast[0].power !== 1) return uName;
  const meta = BASE_UNITS[ast[0].base];
  if (meta?.pointCompanion) return BASE_UNITS[meta.pointCompanion]?.symbol || uName;
  return meta?.symbol || uName;
}

export function hasPointTempInCompound(uName, dimension = null) {
  if (!uName || uName === "dimless" || uName === "ratio") return false;
  const ast = parseUnitToSemanticAST(uName, dimension);
  if (ast.length === 0) return false;
  if (ast.length === 1 && Math.abs(ast[0].power) === 1) return false;
  return ast.some(f => BASE_UNITS[f.base]?.dimMap?.Th && !BASE_UNITS[f.base]?.isDelta);
}

export function semanticASTToTex(factors, inline = false, cancelMode = "none") {
  if (!factors || factors.length === 0) return "";
  const isSet = cancelMode instanceof Set;
  const isIdxCancelled = (idx) =>
    cancelMode === "component" || (isSet && cancelMode.has(idx));

  if (factors.length === 1 && factors[0].base === "percent" && factors[0].power === 1) {
    const shouldCancel = cancelMode === "whole" || isIdxCancelled(0);
    return shouldCancel ? "\\cancel{\\text{\\%}}" : "\\text{\\%}";
  }
  if (factors.length === 1 && factors[0].base === "deg" && factors[0].power === 1) {
    const shouldCancel = cancelMode === "whole" || isIdxCancelled(0);
    return shouldCancel ? "\\cancel{°}" : "°";
  }

  const prefixSymbols = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
  const numStrs = [];
  const denStrs = [];

  factors.forEach((f, idx) => {
    const cancelThis = isIdxCancelled(idx);
    const bMeta = BASE_UNITS[f.base];
    const bSym = bMeta?.symbol || f.base;
    const pSym = f.prefix ? prefixSymbols[f.prefix] || f.prefix : "";
    const fullSym = `${pSym}${bSym}`;

    const absP = Math.abs(f.power);
    const expStr = absP > 1 ? `^{${absP}}` : "";

    let termTex = "";
    const symSuffixMatch = fullSym.match(/^(.+)_(m|f)$/);
    if (fullSym === "%") {
      termTex = cancelThis ? "\\cancel{\\text{\\%}}" : "\\text{\\%}";
    } else if (bMeta?.isDelta) {
      const pointSym = bMeta.pointCompanion ? BASE_UNITS[bMeta.pointCompanion].symbol : bSym.replace(/^Δ/, "");
      if (pointSym.startsWith("°")) {
        termTex = cancelThis ? `\\cancel{\\Delta${pointSym}${expStr}}` : `\\Delta${pointSym}${expStr}`;
      } else {
        termTex = cancelThis ? `\\cancel{\\Delta\\text{${pointSym}}}${expStr}` : `\\Delta\\text{${pointSym}}${expStr}`;
      }
    } else if (fullSym.startsWith("°")) {
      termTex = cancelThis ? `\\cancel{${fullSym}${expStr}}` : `${fullSym}${expStr}`;
    } else if (symSuffixMatch) {
      const [, basePart, subPart] = symSuffixMatch;
      const bodyTex = `\\text{${basePart}}_{${subPart}}`;
      termTex = cancelThis ? `\\cancel{${bodyTex}}${expStr}` : `${bodyTex}${expStr}`;
    } else {
      termTex = cancelThis ? `\\cancel{\\text{${fullSym}}}${expStr}` : `\\text{${fullSym}}${expStr}`;
    }

    if (f.power > 0) numStrs.push(termTex);
    else if (f.power < 0) denStrs.push(termTex);
  });

  const nStr = numStrs.join(" \\cdot ");
  const dStr = denStrs.join(" \\cdot ");
  let res = "";
  if (dStr) {
    const fracCmd = inline ? "\\tfrac" : "\\cfrac";
    res = `${fracCmd}{${nStr || "1"}}{${dStr}}`;
  } else {
    res = nStr;
  }

  if (cancelMode === "whole") return `\\cancel{${res}}`;
  return res;
}

export function unitToTex(unitName = "", inline = false, dimension = null) {
  const ast = parseUnitToSemanticAST(unitName, dimension);
  return semanticASTToTex(ast, inline, "none");
}

export function unitToCancelledTex(unitName = "", inline = false, dimension = null, mode = "whole") {
  const ast = parseUnitToSemanticAST(unitName, dimension);
  return semanticASTToTex(ast, inline, mode);
}

export function getSemanticScale(factors) {
  let scale = 1.0;
  factors.forEach(f => {
    const meta = BASE_UNITS[f.base] || { baseScale: 1.0 };
    let factor = meta.baseScale || 1.0;
    if (f.prefix && PREFIXES[Object.keys(PREFIXES).find(k => PREFIXES[k].name === f.prefix)]) {
      const pKey = Object.keys(PREFIXES).find(k => PREFIXES[k].name === f.prefix);
      factor *= PREFIXES[pKey].scale;
    }
    scale *= Math.pow(factor, f.power);
  });
  return scale;
}

export function getUnitAtomBag(uName, dimension = null) {
  const ast = parseUnitToSemanticAST(uName, dimension);
  const scale = getSemanticScale(ast);
  const dimMap = {};
  let isUnknown = false;
  const isDimensionless = !uName || uName === "dimless" || uName === "ratio";
  ast.forEach(f => {
    if (!BASE_UNITS[f.base]) isUnknown = true;
    const vec = BASE_UNITS[f.base]?.dimMap;
    if (vec) {
      for (const [d, p] of Object.entries(vec)) {
        const next = (dimMap[d] || 0) + p * f.power;
        if (next === 0) delete dimMap[d];
        else dimMap[d] = next;
      }
    }
  });

  let kind = "linear";
  let offset = 0;
  if (ast.length === 1 && ast[0].power === 1 && BASE_UNITS[ast[0].base]?.dimMap?.Th) {
    const bMeta = BASE_UNITS[ast[0].base];
    kind = bMeta.isDelta ? "delta" : "point";
    offset = bMeta.isDelta ? 0 : (bMeta.offset || 0);
  }

  return { scale, dimMap, kind, offset, isDimensionless, isUnknown: !isDimensionless && isUnknown };
}

export function formatValueInUnit(value, unitName = "", dimension = null) {
  if (typeof dimension === "boolean") {
    throw new TypeError("isDifference boolean parameter was removed; use Δ temperature units");
  }
  const { scale, offset } = getUnitAtomBag(unitName, dimension);
  const scaled = scale > 0 ? value / scale : value;
  return scaled - offset;
}

export function valueToCoherentBase(value, unitName = "", dimension = null) {
  if (typeof dimension === "boolean") {
    throw new TypeError("isDifference boolean parameter was removed; use Δ temperature units");
  }
  const { scale, offset } = getUnitAtomBag(unitName, dimension);
  return scale * (value + offset);
}

export function convertUnitValue(value, fromUnit, toUnit, dimension = null) {
  if (!toUnit || fromUnit === toUnit) return value;
  const kFrom = getUnitKind(fromUnit, dimension);
  const kTo = getUnitKind(toUnit, dimension);
  if ((kFrom === "point" && kTo === "delta") || (kFrom === "delta" && kTo === "point")) {
    throw new Error(`Cannot convert affine temperature "${fromUnit}" to/from temperature difference "${toUnit}"`);
  }
  return formatValueInUnit(valueToCoherentBase(value, fromUnit, dimension), toUnit, dimension);
}

export function isDimEqual(aMap = {}, bMap = {}) {
  const keysA = Object.keys(aMap);
  const keysB = Object.keys(bMap);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => aMap[k] === bMap[k]);
}
