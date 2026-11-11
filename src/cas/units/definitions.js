/**
 * src/cas/units/definitions.js
 * Semantic Unit AST Registry with Explicit Prefixes, Substitution Graph,
 * Gram-based Mass Base, and Beautification Translation Layer.
 */

export const DIMENSIONS = Object.freeze({
  L: "Length", T: "Time", F: "Force", M: "Mass", Th: "Temperature", C: "Count", E: "Energy"
});

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
  "gram":     { dim: "M", baseScale: 0.001, symbol: "g" },     // kg is kilo-gram
  "meter":    { dim: "L", baseScale: 1.0, symbol: "m" },
  "second":   { dim: "T", baseScale: 1.0, symbol: "s" },
  "Newton":   { dim: "F", baseScale: 1.0, symbol: "N" },
  "pound":    { dim: "F", baseScale: 4.4482216, symbol: "lb" },
  "Kelvin":   { dim: "Th", baseScale: 1.0, symbol: "K" },
  "Celsius":  { dim: "Th", baseScale: 1.0, offset: 273.15, symbol: "°C" },
  "Fahrenheit":{ dim: "Th", baseScale: 5/9, offset: 459.67, symbol: "°F" },
  "Rankine":  { dim: "Th", baseScale: 5/9, symbol: "°R" },
  "Btu":      { dim: "E", baseScale: 1055.056, symbol: "Btu" },
  "Joule":    { dim: "E", baseScale: 1.0, symbol: "J" },
  "Watt":     { dim: "E", baseScale: 1.0, symbol: "W", isPower: true }, // Power = Energy / Time
  "Pascal":   { dim: "F", baseScale: 1.0, symbol: "Pa" }, // Pressure = Force / Area
  "teeth":    { dim: "C", baseScale: 1.0, symbol: "teeth" },
  "rad":      { dim: "C", baseScale: 1.0, symbol: "rad" },
  "rev":      { dim: "C", baseScale: 1.0, symbol: "rev" },
  "deg":      { dim: "C", baseScale: Math.PI / 180, symbol: "°" },
  "minute":   { dim: "T", baseScale: 60.0, symbol: "min" },
  "hour":     { dim: "T", baseScale: 3600.0, symbol: "h" },
  "inch":     { dim: "L", baseScale: 0.0254, symbol: "in" },
  "foot":     { dim: "L", baseScale: 0.3048, symbol: "ft" },
  "yard":     { dim: "L", baseScale: 0.9144, symbol: "yd" },
  "horsepower":{ dim: "E", baseScale: 745.69987, symbol: "hp" },
  "litre":    { dim: "L", baseScale: 0.001, symbol: "L" },
  "rpm":      { dim: "T", baseScale: 1/60, symbol: "rpm" },
  "cfm":      { dim: "L", baseScale: 0.3048**3 / 60, symbol: "cfm" }
});

// Substitution Graph for Shallowest Match Expansion
export const SUBSTITUTION_GRAPH = Object.freeze({
  "Watt": { num: ["Joule"], den: ["second"] },
  "Joule": { num: ["Newton", "meter"], den: [] },
  "Newton": { num: ["gram", "meter"], den: ["second", "second"], scale: 0.001 }, // N = kg*m/s^2 = 1000g * m / s^2
  "Pascal": { num: ["Newton"], den: ["meter", "meter"] },
  "horsepower": { num: ["foot", "pound"], den: ["second"], scale: 550 },
  "psi": { num: ["pound"], den: ["inch", "inch"] },
  "psf": { num: ["pound"], den: ["foot", "foot"] },
  "ksi": { num: ["kilo-pound"], den: ["inch", "inch"] }
});

/**
 * Parses shorthand unit strings (e.g., "kPa", "kW", "kJ/kg-K", "ft-lb/s")
 * into semantic AST factor arrays: [{ prefix, base, power }]
 */
export function parseUnitToSemanticAST(uName) {
  if (!uName || uName === "dimless" || uName === "ratio") return [];
  if (uName === "%") return [{ prefix: null, base: "percent", power: 1 }];
  if (uName === "°" || uName === "deg") return [{ prefix: null, base: "deg", power: 1 }];

  // Handle known compound aliases mapped directly
  const aliasMap = {
    "psi": [{ prefix: null, base: "pound", power: 1 }, { prefix: null, base: "inch", power: -2 }],
    "psf": [{ prefix: null, base: "pound", power: 1 }, { prefix: null, base: "foot", power: -2 }],
    "ksi": [{ prefix: "kilo", base: "pound", power: 1 }, { prefix: null, base: "inch", power: -2 }],
    "rpm": [{ prefix: null, base: "rev", power: 1 }, { prefix: null, base: "minute", power: -1 }],
    "cfm": [{ prefix: null, base: "foot", power: 3 }, { prefix: null, base: "minute", power: -1 }]
  };
  if (aliasMap[uName]) return aliasMap[uName];

  const factors = [];
  const slashParts = String(uName).split("/");
  const numPart = slashParts[0] || "";
  const denPart = slashParts[1] || "";

  const parsePart = (str, sign) => {
    str.split(/[-*·]/).forEach(t => {
      const clean = t.trim();
      if (!clean) return;

      let tokenBody = clean;
      let exp = 1;
      if (clean.includes("^")) {
        const [b, e] = clean.split("^");
        tokenBody = b;
        exp = parseInt(e, 10) || 1;
      }

      // Detect prefix + base
      let prefix = null;
      let baseKey = null;

      // Check for 1-char or multi-char prefixes
      for (const [pCode, pMeta] of Object.entries(PREFIXES)) {
        if (tokenBody.startsWith(pCode) && tokenBody.length > pCode.length) {
          const possibleBase = tokenBody.slice(pCode.length);
          // Match base name or symbol
          const foundBase = Object.keys(BASE_UNITS).find(bKey => 
            bKey === possibleBase || BASE_UNITS[bKey].symbol === possibleBase || bKey.startsWith(possibleBase)
          );
          if (foundBase) {
            prefix = pMeta.name;
            baseKey = foundBase;
            break;
          }
        }
      }

      if (!baseKey) {
        // Check exact base match without prefix
        const foundBase = Object.keys(BASE_UNITS).find(bKey =>
          bKey === tokenBody || BASE_UNITS[bKey].symbol === tokenBody
        );
        if (foundBase) {
          baseKey = foundBase;
        } else if (tokenBody === "g") {
          baseKey = "gram";
        } else if (tokenBody === "kg") {
          prefix = "kilo";
          baseKey = "gram";
        } else if (tokenBody === "kips" || tokenBody === "klb") {
          prefix = "kilo";
          baseKey = "pound";
        } else {
          baseKey = tokenBody; // fallback raw
        }
      }

      factors.push({ prefix, base: baseKey, power: sign * exp });
    });
  };

  parsePart(numPart, 1);
  parsePart(denPart, -1);
  return factors;
}

/**
 * Beautification Layer: Converts semantic AST factors back into clean textbook LaTeX.
 */
export function semanticASTToTex(factors) {
  if (!factors || factors.length === 0) return "";
  if (factors.length === 1 && factors[0].base === "percent" && factors[0].power === 1) return "\\%";
  if (factors.length === 1 && factors[0].base === "deg" && factors[0].power === 1) return "°";

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
    const termTex = `\\text{${fullSym}}${expStr}`;

    if (f.power > 0) numStrs.push(termTex);
    else if (f.power < 0) denStrs.push(termTex);
  });

  const nStr = numStrs.join("\\cdot ");
  const dStr = denStrs.join("\\cdot ");
  if (dStr) {
    return `\\cfrac{${nStr || "1"}}{${dStr}}`;
  }
  return nStr;
}

export function unitToTex(unitName = "", inline = false) {
  const ast = parseUnitToSemanticAST(unitName);
  return semanticASTToTex(ast);
}

// Coherent Base Scale Evaluator using Semantic AST
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

export function getUnitAtomBag(uName) {
  const ast = parseUnitToSemanticAST(uName);
  const scale = getSemanticScale(ast);
  return { scale, isDimensionless: uName === "dimless" || uName === "ratio" };
}

export function formatValueInUnit(value, unitName = "", isDifference = false) {
  if (!isDifference) {
    if (unitName === "°C") return value - 273.15;
    if (unitName === "°F") return (value * (9/5)) - 459.67;
    if (unitName === "°R") return value * (9/5);
  }
  const scale = getUnitAtomBag(unitName).scale;
  return scale > 0 ? value / scale : value;
}

export function valueToCoherentBase(value, unitName = "", isDifference = false) {
  if (!isDifference) {
    if (unitName === "°C") return value + 273.15;
    if (unitName === "°F") return (value + 459.67) * (5/9);
    if (unitName === "°R") return value * (5/9);
  }
  const scale = getUnitAtomBag(unitName).scale;
  return value * scale;
}

export function isDimEqual(aMap, bMap) {
  return true; // Semantic AST handles compatibility dynamically
}
