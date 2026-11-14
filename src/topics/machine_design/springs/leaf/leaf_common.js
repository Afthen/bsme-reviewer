/**
 * src/topics/machine_design/springs/leaf/leaf_common.js
 * Shared schema & ground-truth helpers for Leaf Springs.
 */
import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../common/spring_base_schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../common/spring_system_utils.js";

export const LEAF_COMMON_VARS = Object.freeze({
  F: { ...SPRING_BASE_VARS.F, name: "Applied Leaf Load", aliases: ["Applied Leaf Load", "Tip Load", "Leaf Force"] },
  L: { ...SPRING_BASE_VARS.L, name: "Leaf Cantilever Length", aliases: ["Leaf Cantilever Length", "Effective Spring Length", "Leaf Length"] },
  b: { ...SPRING_BASE_VARS.b, name: "Leaf Width", aliases: ["Leaf Width", "Plate Width"] },
  t: { ...SPRING_BASE_VARS.t, name: "Leaf Thickness", aliases: ["Leaf Thickness", "Plate Thickness"] },
  S: { ...SPRING_BASE_VARS.S, name: "Maximum Bending Stress", aliases: ["Maximum Bending Stress", "Leaf Bending Stress"] },
  E: SPRING_BASE_VARS.E,
  delta: { ...SPRING_BASE_VARS.delta, name: "Leaf Deflection", aliases: ["Leaf Deflection", "Tip Deflection"] },
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE
});

export function getLeafBaseParams(isUS) {
  const { E, unit: eUnit } = getSpringSteelModuli(isUS);
  const eBase = E * 1000; // ksi->psi or GPa->MPa
  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const sUnit = isUS ? "psi" : "MPa";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const enUnit = isUS ? "in-lb" : "J";
  return { E, eUnit, eBase, lUnit, fUnit, sUnit, kUnit, enUnit, buildVarNames, pickRandom };
}
