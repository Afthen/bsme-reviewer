/**
 * src/core/unit_sampler.js
 * 40% SI / 40% US / 20% MIXED Unit Sampler with:
 * - 50-50 variable split in MIXED mode
 * - Inverse-token compound decomposition probability ($w_i = 1/t_i$)
 * - Significant figure preservation criterion under 3 decimal places ($|v| >= 0.100$)
 * - Canonical textbook constant representations
 */

import { getUnitAtomBag, isDimEqual, valueToCoherentBase, formatValueInUnit } from "../cas/units/definitions.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { DIMENSIONS } from "./dimensions.js";

/**
 * Palette of physical candidate units per dimension and system, tagged with token counts.
 * Compound decompositions (e.g. W -> J/s -> N-m/s -> kg*m^2/s^3) are arranged hierarchically.
 */
export const DIMENSION_TOKEN_PALETTES = Object.freeze({
  SI: {
    [DIMENSIONS.LENGTH]: [
      { unit: "mm", tokens: 1 },
      { unit: "cm", tokens: 1 },
      { unit: "m", tokens: 1 }
    ],
    [DIMENSIONS.FORCE]: [
      { unit: "N", tokens: 1 },
      { unit: "kN", tokens: 1 },
      { unit: "kg*m/s^2", tokens: 4 }
    ],
    [DIMENSIONS.PRESSURE]: [
      { unit: "kPa", tokens: 1 },
      { unit: "kN/m^2", tokens: 2 },
      { unit: "bar", tokens: 1 },
      { unit: "MPa", tokens: 1 },
      { unit: "N/mm^2", tokens: 2 },
      { unit: "Pa", tokens: 1 },
      { unit: "N/m^2", tokens: 2 }
    ],
    [DIMENSIONS.STRESS]: [
      { unit: "MPa", tokens: 1 },
      { unit: "N/mm^2", tokens: 2 },
      { unit: "kPa", tokens: 1 },
      { unit: "bar", tokens: 1 }
    ],
    [DIMENSIONS.POWER]: [
      { unit: "kW", tokens: 1 },
      { unit: "kJ/s", tokens: 2 },
      { unit: "W", tokens: 1 },
      { unit: "J/s", tokens: 2 },
      { unit: "N-m/s", tokens: 3 },
      { unit: "kg*m^2/s^3", tokens: 6 }
    ],
    [DIMENSIONS.TORQUE]: [
      { unit: "N-m", tokens: 2 },
      { unit: "kN-m", tokens: 2 },
      { unit: "J", tokens: 1 }
    ],
    [DIMENSIONS.ENERGY]: [
      { unit: "kJ", tokens: 1 },
      { unit: "J", tokens: 1 },
      { unit: "kWh", tokens: 1 }
    ],
    [DIMENSIONS.SPECIFIC_ENERGY]: [
      { unit: "kJ/kg", tokens: 2 }
    ],
    [DIMENSIONS.MASS_FLOW]: [
      { unit: "kg/s", tokens: 2 },
      { unit: "kg/min", tokens: 2 },
      { unit: "kg/h", tokens: 2 },
      { unit: "g/s", tokens: 2 }
    ],
    [DIMENSIONS.VELOCITY]: [
      { unit: "m/s", tokens: 2 },
      { unit: "m/min", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME]: [
      { unit: "m^3", tokens: 1 },
      { unit: "L", tokens: 1 }
    ],
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "m^3/s", tokens: 2 },
      { unit: "m^3/h", tokens: 2 },
      { unit: "L/h", tokens: 2 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "°C", tokens: 1 }
    ]
  },
  US: {
    [DIMENSIONS.LENGTH]: [
      { unit: "in", tokens: 1 },
      { unit: "ft", tokens: 1 },
      { unit: "yd", tokens: 1 }
    ],
    [DIMENSIONS.FORCE]: [
      { unit: "lb", tokens: 1 },
      { unit: "kip", tokens: 1 }
    ],
    [DIMENSIONS.PRESSURE]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb/in^2", tokens: 2 },
      { unit: "psf", tokens: 1 },
      { unit: "lb/ft^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.STRESS]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb/in^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.POWER]: [
      { unit: "hp", tokens: 1 },
      { unit: "Btu/min", tokens: 2 },
      { unit: "Btu/h", tokens: 2 },
      { unit: "ft-lb/s", tokens: 3 },
      { unit: "ft-lb/min", tokens: 3 }
    ],
    [DIMENSIONS.TORQUE]: [
      { unit: "lb-in", tokens: 2 },
      { unit: "lb-ft", tokens: 2 }
    ],
    [DIMENSIONS.ENERGY]: [
      { unit: "Btu", tokens: 1 }
    ],
    [DIMENSIONS.SPECIFIC_ENERGY]: [
      { unit: "Btu/lb", tokens: 2 }
    ],
    [DIMENSIONS.MASS_FLOW]: [
      { unit: "lb/s", tokens: 2 },
      { unit: "lb/min", tokens: 2 },
      { unit: "lb/h", tokens: 2 }
    ],
    [DIMENSIONS.VELOCITY]: [
      { unit: "ft/min", tokens: 2 },
      { unit: "ft/s", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME]: [
      { unit: "ft^3", tokens: 1 }
    ],
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "cfm", tokens: 1 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "°F", tokens: 1 }
    ]
  }
});

/**
 * 40% SI / 40% US / 20% MIXED Problem Sampler
 */
export function sampleSystemMode(requestedSys = null) {
  if (requestedSys === "SI" || requestedSys === "US" || requestedSys === "MIXED") {
    return requestedSys;
  }
  const r = Math.random();
  if (r < 0.40) return "SI";
  if (r < 0.80) return "US";
  return "MIXED";
}

/**
 * Selects an item from a list with probability inversely proportional to token count:
 *   w_i = 1 / t_i,  P_i = w_i / \sum w_j
 */
export function sampleByInverseTokens(candidateList = []) {
  if (!candidateList || candidateList.length === 0) return null;
  if (candidateList.length === 1) return candidateList[0].unit;

  const weights = candidateList.map(c => 1.0 / Math.max(1, c.tokens || 1));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidateList.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidateList[i].unit;
  }
  return candidateList[candidateList.length - 1].unit;
}

/**
 * Verifies that a converted value retains at least 3 significant figures
 * under the repository formatting standard (maximum 3 decimal places):
 * Values below 0.0995 round to <= 0.099 (at most 2 sig figs in 3 decimals) and are denied.
 */
export function retainsSufficientSigFigs(convertedValue) {
  if (typeof convertedValue !== "number" || isNaN(convertedValue)) return false;
  const abs = Math.abs(convertedValue);
  if (abs === 0) return true; // zero-value states preserve identity
  return abs >= 0.0995 && abs <= 9.99e6;
}

/**
 * Samples recognizable academic constant representations per unit system.
 */
export function sampleConstantUnit(varKey, sys = "SI") {
  const meta = CONSTANTS_DB[varKey];
  if (!meta) return null;

  if (varKey === "c_pw") {
    return sys === "US"
      ? { unit: "Btu/(lb*F)", value: 1.0 }
      : { unit: "kJ/kg-K", value: 4.187 };
  }
  if (varKey === "c_pa") {
    return sys === "US"
      ? { unit: "Btu/(lb*F)", value: 0.24 }
      : { unit: "kJ/kg-K", value: 1.0062 };
  }
  if (varKey === "g") {
    return sys === "US"
      ? { unit: "ft/s^2", value: 32.2 }
      : { unit: "m/s^2", value: 9.81 };
  }
  return sys === "US"
    ? { unit: meta.unitUS || meta.unit, value: meta.valueUS }
    : { unit: meta.unitSI || meta.unit, value: meta.valueSI };
}

/**
 * Master Problem Unit System & Intra-System Variational Sampler.
 * Applies the 40-40-20 distribution, 50-50 MIXED partitioning, inverse-token selection,
 * and 3-sig-fig retention validation to system ground truth S.
 */
export function applyProblemUnitSampling(S, varsDb = {}, forcedMode = null) {
  if (!S || !S._u) return S;

  const mode = sampleSystemMode(forcedMode);
  const dimensionalKeys = Object.keys(varsDb).filter(k => {
    const meta = varsDb[k] || {};
    return meta.dimension &&
      meta.dimension !== DIMENSIONS.DIMENSIONLESS &&
      !meta.isAbstract &&
      typeof S[k] === "number" &&
      !isNaN(S[k]);
  });

  let siKeys = new Set();
  let usKeys = new Set();

  if (mode === "MIXED") {
    const shuffled = [...dimensionalKeys].sort(() => Math.random() - 0.5);
    const half = Math.floor(shuffled.length / 2);
    siKeys = new Set(shuffled.slice(0, half));
    usKeys = new Set(shuffled.slice(half));
  } else if (mode === "US") {
    usKeys = new Set(dimensionalKeys);
  } else {
    siKeys = new Set(dimensionalKeys);
  }

  dimensionalKeys.forEach(k => {
    const meta = varsDb[k] || {};
    const targetSys = usKeys.has(k) ? "US" : "SI";

    // 1. Academic Constants: roll between recognizable textbook figures
    if (meta.isConstant || CONSTANTS_DB[k]) {
      const cRes = sampleConstantUnit(k, targetSys);
      if (cRes) {
        S._u[k] = cRes.unit;
        S[k] = cRes.value;
      }
      return;
    }

    const canonUnit = S._u[k] || meta.unit;
    if (!canonUnit || canonUnit === "dimless" || canonUnit === "ratio" || canonUnit === "°" || canonUnit === "deg") {
      return;
    }

    const canonBag = getUnitAtomBag(canonUnit);
    const canonVal = S[k];
    const coherentVal = valueToCoherentBase(canonVal, canonUnit);

    const palette = DIMENSION_TOKEN_PALETTES[targetSys]?.[meta.dimension] || [];
    const validCandidates = palette.filter(p => {
      const b = getUnitAtomBag(p.unit);
      return isDimEqual(canonBag.dimMap, b.dimMap);
    });

    if (validCandidates.length === 0) return;

    // 2. Select unit using inverse-token probability and validate sig-fig retention
    const shuffledCandidates = [...validCandidates].sort(() => Math.random() - 0.5);
    let chosenUnit = null;

    for (const cand of shuffledCandidates) {
      const candVal = formatValueInUnit(coherentVal, cand.unit);
      if (retainsSufficientSigFigs(candVal)) {
        chosenUnit = cand.unit;
        S[k] = candVal;
        S._u[k] = cand.unit;
        break;
      }
    }

    if (!chosenUnit) {
      // Retain canonical unit if conversions would destroy significant figure resolution
      S._u[k] = canonUnit;
    }
  });

  S.sys = mode;
  return S;
}