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

export const BASE_UNITS = Object.freeze({
  "gram":           { dim: "M", baseScale: 0.001, symbol: "g" },
  "pound_mass":     { dim: "M", baseScale: 0.45359237, symbol: "lb" },
  "pound_force":    { dim: "F", baseScale: 4.4482216, symbol: "lb" },
  "kilogram_force": { dim: "F", baseScale: 9.80665, symbol: "kgf" },
  "newton":         { dim: "F", baseScale: 1.0, symbol: "N" },
  "meter":          { dim: "L", baseScale: 1.0, symbol: "m" },
  "second":         { dim: "T", baseScale: 1.0, symbol: "s" },
  "percent":        { dim: "C", baseScale: 0.01, symbol: "%" },
  "Kelvin":         { dim: "Th", baseScale: 1.0, symbol: "K" },
  "Celsius":        { dim: "Th", baseScale: 1.0, offset: 273.15, symbol: "°C" },
  "Fahrenheit":     { dim: "Th", baseScale: 5/9, offset: 459.67, symbol: "°F" },
  "Rankine":        { dim: "Th", baseScale: 5/9, symbol: "°R" },
  "Btu":            { dim: "E", baseScale: 1055.056, symbol: "Btu" },
  "Joule":          { dim: "E", baseScale: 1.0, symbol: "J" },
  "Watt":           { dim: "E", baseScale: 1.0, symbol: "W" },
  "Pascal":         { dim: "F", baseScale: 1.0, symbol: "Pa" },
  "teeth":          { dim: "C", baseScale: 1.0, symbol: "teeth" },
  "rad":            { dim: "C", baseScale: 1.0, symbol: "rad" },
  "rev":            { dim: "C", baseScale: 1.0, symbol: "rev" },
  "deg":            { dim: "C", baseScale: Math.PI / 180, symbol: "°" },
  "minute":         { dim: "T", baseScale: 60.0, symbol: "min" },
  "hour":           { dim: "T", baseScale: 3600.0, symbol: "h" },
  "inch":           { dim: "L", baseScale: 0.0254, symbol: "in" },
  "foot":           { dim: "L", baseScale: 0.3048, symbol: "ft" },
  "yard":           { dim: "L", baseScale: 0.9144, symbol: "yd" },
  "horsepower":     { dim: "E", baseScale: 745.69987, symbol: "hp" },
  "kWh":            { dim: "E", baseScale: 3600000.0, symbol: "kWh" },
  "litre":          { dim: "L", baseScale: 0.001, symbol: "L" },
  "rpm":            { dim: "T", baseScale: 1/60, symbol: "rpm" },
  "cfm":            { dim: "L", baseScale: 0.3048**3 / 60, symbol: "cfm" }
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

  // Explicit force/mass tokens
  if (tokenBody === "lbf" || tokenBody === "lb_f") return { prefix: null, base: "pound_force" };
  if (tokenBody === "lbm" || tokenBody === "lb_m") return { prefix: null, base: "pound_mass" };
  if (tokenBody === "kgf") return { prefix: null, base: "kilogram_force" };
  if (tokenBody === "kips" || tokenBody === "klb") return { prefix: "kilo", base: "pound_force" };
  if (tokenBody === "kg") return { prefix: "kilo", base: "gram" };
  if (tokenBody === "g") return { prefix: null, base: "gram" };
  if (tokenBody === "N") return { prefix: null, base: "newton" };

  // Dimension-Aware Ambiguous "lb" Resolution
  if (tokenBody === "lb") {
    if (
      dimension === DIMENSIONS.MASS ||
      dimension === DIMENSIONS.MASS_FLOW ||
      dimension === DIMENSIONS.SPECIFIC_ENERGY ||
      dimension === DIMENSIONS.SPECIFIC_CONSUMPTION
    ) {
      return { prefix: null, base: "pound_mass" };
    }
    return { prefix: null, base: "pound_force" };
  }

  // Exact base match
  const foundExact = Object.keys(BASE_UNITS).find(
    bKey => bKey === tokenBody || BASE_UNITS[bKey].symbol === tokenBody
  );
  if (foundExact) {
    return { prefix: null, base: foundExact };
  }

  // Prefix matching
  for (const [pCode, pMeta] of Object.entries(PREFIXES)) {
    if (tokenBody.startsWith(pCode) && tokenBody.length > pCode.length) {
      const possibleBase = tokenBody.slice(pCode.length);
      const foundBase = Object.keys(BASE_UNITS).find(
        bKey => bKey === possibleBase || BASE_UNITS[bKey].symbol === possibleBase
      );
      if (foundBase) {
        return { prefix: pMeta.name, base: foundBase };
      }
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

  const ast = parseUnitAST(uName, dimension);
  return flattenUnitAST(ast);
}

export function getAbsoluteCompanionUnit(uName) {
  const ast = parseUnitToSemanticAST(uName);
  if (ast.length !== 1) return uName;
  const meta = BASE_UNITS[ast[0].base];
  if (meta?.dim !== "Th" || !meta.offset) return uName;

  for (const b of Object.values(BASE_UNITS)) {
    if (b.dim === "Th" && !b.offset && Math.abs(b.baseScale - meta.baseScale) < 1e-6) {
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

  if (cancelMode === "whole") {
    return `\\cancel{${res}}`;
  }
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
  return { scale, isDimensionless: !uName || uName === "dimless" || uName === "ratio" };
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

export function isDimEqual(aMap, bMap) {
  return true;
}
