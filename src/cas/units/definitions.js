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
export const BASE_UNITS = Object.freeze({
  "gram":           { baseScale: 0.001, symbol: "g", dimMap: { M: 1 } },
  "pound_mass":     { baseScale: 0.45359237, symbol: "lb", dimMap: { M: 1 } },
  "pound_force":    { baseScale: 4.4482216, symbol: "lb", dimMap: { M: 1, L: 1, T: -2 } },
  "kilogram_force": { baseScale: 9.80665, symbol: "kgf", dimMap: { M: 1, L: 1, T: -2 } },
  "newton":         { baseScale: 1.0, symbol: "N", dimMap: { M: 1, L: 1, T: -2 } },
  "meter":          { baseScale: 1.0, symbol: "m", dimMap: { L: 1 } },
  "second":         { baseScale: 1.0, symbol: "s", dimMap: { T: 1 } },
  "percent":        { baseScale: 0.01, symbol: "%", dimMap: { Pct: 1 } },
  "Kelvin":         { baseScale: 1.0, symbol: "K", dimMap: { Th: 1 } },
  "Celsius":        { baseScale: 1.0, symbol: "°C", dimMap: { Th: 1 }, offset: 273.15 },
  "Fahrenheit":     { baseScale: 5/9, symbol: "°F", dimMap: { Th: 1 }, offset: 459.67 },
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
});

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

export function resolveUnitToken(tokenBody, dimension = null) {
  if (tokenBody === "%" || tokenBody === "\\%") return { prefix: null, base: "percent" };
  if (tokenBody === "°" || tokenBody === "deg") return { prefix: null, base: "deg" };
  if (tokenBody === "F" || tokenBody === "°F") return { prefix: null, base: "Fahrenheit" };
  if (tokenBody === "C" || tokenBody === "°C") return { prefix: null, base: "Celsius" };
  if (tokenBody === "R" || tokenBody === "°R") return { prefix: null, base: "Rankine" };
  if (tokenBody === "K") return { prefix: null, base: "Kelvin" };

  if (tokenBody === "lbf" || tokenBody === "lb_f") return { prefix: null, base: "pound_force" };
  if (tokenBody === "lbm" || tokenBody === "lb_m") return { prefix: null, base: "pound_mass" };
  if (tokenBody === "kgf") return { prefix: null, base: "kilogram_force" };
  if (tokenBody === "kip" || tokenBody === "kips" || tokenBody === "klb") return { prefix: "kilo", base: "pound_force" };
  if (tokenBody === "hr") return { prefix: null, base: "hour" };
  if (tokenBody === "kg") return { prefix: "kilo", base: "gram" };
  if (tokenBody === "g") return { prefix: null, base: "gram" };
  if (tokenBody === "N") return { prefix: null, base: "newton" };

  if (tokenBody === "lb") {
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
    bKey => bKey === tokenBody || BASE_UNITS[bKey].symbol === tokenBody
  );
  if (foundExact) return { prefix: null, base: foundExact };

  for (const [pCode, pMeta] of Object.entries(PREFIXES)) {
    if (tokenBody.startsWith(pCode) && tokenBody.length > pCode.length) {
      const possibleBase = tokenBody.slice(pCode.length);
      const foundBase = Object.keys(BASE_UNITS).find(
        bKey => bKey === possibleBase || BASE_UNITS[bKey].symbol === possibleBase
      );
      if (foundBase) return { prefix: pMeta.name, base: foundBase };
    }
  }

  return { prefix: null, base: tokenBody };
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

export function getAbsoluteCompanionUnit(uName) {
  const ast = parseUnitToSemanticAST(uName);
  if (ast.length !== 1) return uName;
  const meta = BASE_UNITS[ast[0].base];
  if (!meta?.dimMap?.Th || !meta.offset) return uName;

  for (const b of Object.values(BASE_UNITS)) {
    if (b.dimMap?.Th && !b.offset && Math.abs(b.baseScale - meta.baseScale) < 1e-6) {
      return b.symbol;
    }
  }
  return "K";
}

export function semanticASTToTex(factors, inline = false, cancelMode = "none") {
  if (!factors || factors.length === 0) return "";
  if (factors.length === 1 && factors[0].base === "percent" && factors[0].power === 1) {
    return cancelMode !== "none" ? "\\cancel{\\text{\\%}}" : "\\text{\\%}";
  }
  if (factors.length === 1 && factors[0].base === "deg" && factors[0].power === 1) {
    return cancelMode !== "none" ? "\\cancel{°}" : "°";
  }

  const prefixSymbols = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
  const numStrs = [];
  const denStrs = [];

  factors.forEach(f => {
    const bMeta = BASE_UNITS[f.base];
    const bSym = bMeta?.symbol || f.base;
    const pSym = f.prefix ? prefixSymbols[f.prefix] || f.prefix : "";
    const fullSym = `${pSym}${bSym}`;

    const absP = Math.abs(f.power);
    const expStr = absP > 1 ? `^{${absP}}` : "";

    let termTex = "";
    if (fullSym === "%") {
      termTex = cancelMode === "component" ? "\\cancel{\\text{\\%}}" : "\\text{\\%}";
    } else if (fullSym.startsWith("°")) {
      termTex = cancelMode === "component" ? `\\cancel{${fullSym}${expStr}}` : `${fullSym}${expStr}`;
    } else {
      termTex = cancelMode === "component" ? `\\cancel{\\text{${fullSym}}}${expStr}` : `\\text{${fullSym}}${expStr}`;
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
  return { scale, dimMap, isDimensionless, isUnknown: !isDimensionless && isUnknown };
}

export function formatValueInUnit(value, unitName = "", isDifference = false, dimension = null) {
  if (!isDifference) {
    if (unitName === "°C") return value - 273.15;
    if (unitName === "°F") return (value * (9/5)) - 459.67;
    if (unitName === "°R") return value * (9/5);
  }
  const scale = getUnitAtomBag(unitName, dimension).scale;
  return scale > 0 ? value / scale : value;
}

export function valueToCoherentBase(value, unitName = "", isDifference = false, dimension = null) {
  if (!isDifference) {
    if (unitName === "°C") return value + 273.15;
    if (unitName === "°F") return (value + 459.67) * (5/9);
    if (unitName === "°R") return value * (5/9);
  }
  const scale = getUnitAtomBag(unitName, dimension).scale;
  return value * scale;
}

export function isDimEqual(aMap = {}, bMap = {}) {
  const keysA = Object.keys(aMap);
  const keysB = Object.keys(bMap);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => aMap[k] === bMap[k]);
}
