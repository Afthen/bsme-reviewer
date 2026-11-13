/**
 * src/topics/machine_design/springs/common/concentric_helper.js
 * Shared schema, relations, and ground-truth builder for Concentric / Indeterminate Springs.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { SPRING_BASE_VARS } from "./spring_base_schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "./spring_system_utils.js";

export function buildConcentricVarsDb(includeGap = false) {
  const base = {
    "F":    SPRING_BASE_VARS.F,
    "F_o":  { name: "Outer Spring Load", symbol: "F_o", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Outer Spring Load", "Outer Coil Force"] },
    "F_i":  { name: "Inner Spring Load", symbol: "F_i", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Inner Spring Load", "Inner Coil Force"] },
    "k_o":  { name: "Outer Spring Rate", symbol: "k_o", dimension: DIMENSIONS.STIFFNESS, unit: "N/mm", aliases: ["Outer Spring Rate", "Outer Stiffness"] },
    "k_i":  { name: "Inner Spring Rate", symbol: "k_i", dimension: DIMENSIONS.STIFFNESS, unit: "N/mm", aliases: ["Inner Spring Rate", "Inner Stiffness"] },
    "C_o":  { name: "Outer Spring Index", symbol: "C_o", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Outer Spring Index"] },
    "C_i":  { name: "Inner Spring Index", symbol: "C_i", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Inner Spring Index"] },
    "n_o":  { name: "Outer Active Coils", symbol: "n_o", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Outer Active Coils", "Outer Coils"] },
    "n_i":  { name: "Inner Active Coils", symbol: "n_i", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Inner Active Coils", "Inner Coils"] },
    "d_wo": { name: "Outer Wire Diameter", symbol: "d_{wo}", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Outer Wire Diameter"] },
    "d_wi": { name: "Inner Wire Diameter", symbol: "d_{wi}", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Inner Wire Diameter"] },
    "G_o":  { ...SPRING_BASE_VARS.G, name: "Outer Shear Modulus", symbol: "G_o", aliases: ["Outer Shear Modulus", "Outer Modulus of Rigidity"] },
    "G_i":  { ...SPRING_BASE_VARS.G, name: "Inner Shear Modulus", symbol: "G_i", aliases: ["Inner Shear Modulus", "Inner Modulus of Rigidity"] }
  };

  if (!includeGap) {
    return Object.freeze({ ...base, "delta": SPRING_BASE_VARS.delta });
  }
  return Object.freeze({
    ...base,
    "delta_o": { name: "Outer Spring Deflection", symbol: "\\delta_o", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Outer Spring Deflection"] },
    "delta_i": { name: "Inner Spring Deflection", symbol: "\\delta_i", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Inner Spring Deflection"] },
    "e":       { name: "Initial Height Difference", symbol: "e", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Initial Height Difference", "Free-Height Gap"] }
  });
}

export function buildConcentricRelations(mode = "equal") {
  const prefix = `concentric_${mode}`;
  const isEqual = mode === "equal";
  const dO = isEqual ? "delta" : "delta_o";
  const dI = isEqual ? "delta" : "delta_i";

  const rels = [
    defineRelation({ id: `eq_${prefix}_force_sum`, name: "Total Concentric Load", formula: "F = F_o + F_i" }),
    defineRelation({ id: `eq_${prefix}_rate_o`, name: "Outer Coil Rate", formula: "k_o = (G_o * d_wo) / (8 * (C_o^3) * n_o)" }),
    defineRelation({ id: `eq_${prefix}_rate_i`, name: "Inner Coil Rate", formula: "k_i = (G_i * d_wi) / (8 * (C_i^3) * n_i)" }),
    defineRelation({ id: `eq_${prefix}_fo`, name: "Outer Spring Force", formula: `F_o = k_o * ${dO}` }),
    defineRelation({ id: `eq_${prefix}_fi`, name: "Inner Spring Force", formula: `F_i = k_i * ${dI}` }),
    defineRelation({ id: `eq_${prefix}_defl_o`, name: "Outer Coil Deflection", formula: `${dO} = (8 * F_o * (C_o^3) * n_o) / (G_o * d_wo)` }),
    defineRelation({ id: `eq_${prefix}_defl_i`, name: "Inner Coil Deflection", formula: `${dI} = (8 * F_i * (C_i^3) * n_i) / (G_i * d_wi)` })
  ];

  if (mode === "equal") {
    rels.push(defineRelation({ id: "eq_concentric_equal_load", name: "Total Load (Equal Height)", formula: "F = (k_o + k_i) * delta" }));
  } else if (mode === "outer_longer") {
    rels.push(
      defineRelation({ id: "eq_concentric_outer_gap", name: "Deflection Compatibility (Outer Longer)", formula: "delta_o = e + delta_i" }),
      defineRelation({ id: "eq_concentric_outer_load", name: "Total Load (Outer Longer)", formula: "F = k_o * delta_o + k_i * (delta_o - e)" })
    );
  } else {
    rels.push(
      defineRelation({ id: "eq_concentric_inner_gap", name: "Deflection Compatibility (Inner Longer)", formula: "delta_i = e + delta_o" }),
      defineRelation({ id: "eq_concentric_inner_load", name: "Total Load (Inner Longer)", formula: "F = k_i * delta_i + k_o * (delta_i - e)" })
    );
  }
  return compileRelations(rels);
}

export function createConcentricSystem({ sys = "SI", mode = "equal", varsDb }) {
  const isUS = sys === "US";
  const { G, unit: gUnit } = getSpringSteelModuli(isUS);
  const G_o = G;
  const G_i = G;
  const gBase = isUS ? G * 1000 : G * 1000; // ksi->psi or GPa->MPa

  const d_wo = isUS ? 0.5 : 10;
  const d_wi = isUS ? 0.375 : 6;
  const C_o = pickRandom([7, 8, 9]);
  const C_i = pickRandom([6, 7, 8]);
  const n_o = pickRandom([8, 10, 12]);
  const n_i = pickRandom([10, 12, 14]);

  const k_o = (gBase * d_wo) / (8 * (C_o ** 3) * n_o);
  const k_i = (gBase * d_wi) / (8 * (C_i ** 3) * n_i);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const _names = buildVarNames(varsDb);

  const commonU = {
    F: fUnit, F_o: fUnit, F_i: fUnit, k_o: kUnit, k_i: kUnit,
    C_o: "dimless", C_i: "dimless", n_o: "dimless", n_i: "dimless",
    d_wo: lUnit, d_wi: lUnit, G_o: gUnit, G_i: gUnit
  };

  if (mode === "equal") {
    const delta = isUS ? pickRandom([1.2, 1.5, 1.8]) : pickRandom([24, 30, 36]);
    const F_o = k_o * delta;
    const F_i = k_i * delta;
    const F = F_o + F_i;
    return {
      sys, F, F_o, F_i, k_o, k_i, delta, C_o, C_i, n_o, n_i, d_wo, d_wi, G_o, G_i,
      _names, _u: { ...commonU, delta: lUnit }
    };
  }

  const e = isUS ? pickRandom([0.3, 0.4, 0.5]) : pickRandom([5, 6, 8]);
  const smallD = isUS ? pickRandom([1.0, 1.2, 1.4]) : pickRandom([20, 24, 28]);
  const delta_o = mode === "outer_longer" ? smallD + e : smallD;
  const delta_i = mode === "outer_longer" ? smallD : smallD + e;
  const F_o = k_o * delta_o;
  const F_i = k_i * delta_i;
  const F = F_o + F_i;

  return {
    sys, F, F_o, F_i, k_o, k_i, delta_o, delta_i, e, C_o, C_i, n_o, n_i, d_wo, d_wi, G_o, G_i,
    _names, _u: { ...commonU, delta_o: lUnit, delta_i: lUnit, e: lUnit }
  };
}
