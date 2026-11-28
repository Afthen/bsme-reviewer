/**
 * src/topics/machine_design/common/shaft_base_schema.js
 * Shared Machine Design shafting variable dictionary.
 * Reuses foundational STRESS_BASE_VARS where definitions match.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";
import { STRESS_BASE_VARS } from "./stress_base_schema.js";

export const SHAFT_BASE_VARS = Object.freeze({
  "P": {
    name: "Transmitted Power",
    symbol: "P",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Transmitted Power", "Shaft Power", "Rated Power"],
    symbolAliases: ["P", "\\dot{W}"],
    aliases: ["Transmitted Power", "Shaft Power", "Rated Power"]
  },
  "T": {
    ...STRESS_BASE_VARS.T,
    name: "Transmitted Torque",
    nameAliases: ["Transmitted Torque", "Applied Shaft Torque", "Shaft Torque"],
    aliases: ["Transmitted Torque", "Applied Shaft Torque", "Shaft Torque"]
  },
  "n_op": {
    name: "Shaft Speed",
    symbol: "n",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    nameAliases: ["Shaft Speed", "Operating Speed", "Rotational Speed"],
    symbolAliases: ["n", "N"],
    aliases: ["Shaft Speed", "Operating Speed", "Rotational Speed"]
  },
  "omega": {
    name: "Shaft Angular Velocity",
    symbol: "\\omega",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rad/s",
    nameAliases: ["Shaft Angular Velocity", "Angular Speed", "Angular Velocity"],
    symbolAliases: ["\\omega"],
    aliases: ["Shaft Angular Velocity", "Angular Speed", "Angular Velocity"]
  },
  "d": {
    name: "Shaft Diameter",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Shaft Diameter", "Solid Shaft Diameter", "Section Diameter"],
    symbolAliases: ["d", "D"],
    aliases: ["Shaft Diameter", "Solid Shaft Diameter", "Section Diameter"]
  },
  "d_o": {
    name: "Hollow Shaft Outer Diameter",
    symbol: "d_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Shaft Outer Diameter", "Outer Shaft Diameter", "Outside Diameter"],
    symbolAliases: ["d_o", "D_o"],
    aliases: ["Hollow Shaft Outer Diameter", "Outer Shaft Diameter", "Outside Diameter"]
  },
  "d_i": {
    name: "Hollow Shaft Inner Diameter",
    symbol: "d_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Shaft Inner Diameter", "Inner Bore Diameter", "Inside Diameter"],
    symbolAliases: ["d_i", "D_i"],
    aliases: ["Hollow Shaft Inner Diameter", "Inner Bore Diameter", "Inside Diameter"]
  },
  "k_d": {
    name: "Hollow Diameter Ratio",
    symbol: "K",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Hollow Diameter Ratio", "Bore-to-Outer Diameter Ratio", "Diameter Ratio"],
    symbolAliases: ["K", "k_d", "C"],
    aliases: ["Hollow Diameter Ratio", "Bore-to-Outer Diameter Ratio", "Diameter Ratio"]
  },
  "L": {
    name: "Bearing Span",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Bearing Span", "Shaft Span Length", "Center-to-Center Bearing Span"],
    symbolAliases: ["L"],
    aliases: ["Bearing Span", "Shaft Span Length", "Center-to-Center Bearing Span"]
  },
  "M": {
    ...STRESS_BASE_VARS.M,
    name: "Resultant Bending Moment",
    nameAliases: ["Resultant Bending Moment", "Peak Bending Moment", "Combined Bending Moment"],
    aliases: ["Resultant Bending Moment", "Peak Bending Moment", "Combined Bending Moment"]
  },
  "M_h": {
    name: "Horizontal Bending Moment",
    symbol: "M_h",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Horizontal Bending Moment", "Horizontal-Plane Moment"],
    symbolAliases: ["M_h", "M_z"],
    aliases: ["Horizontal Bending Moment", "Horizontal-Plane Moment"]
  },
  "M_v": {
    name: "Vertical Bending Moment",
    symbol: "M_v",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Vertical Bending Moment", "Vertical-Plane Moment"],
    symbolAliases: ["M_v", "M_y"],
    aliases: ["Vertical Bending Moment", "Vertical-Plane Moment"]
  },
  "F_a": {
    name: "Axial Thrust Load",
    symbol: "F_a",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Axial Thrust Load", "Shaft Axial Force", "Thrust Force"],
    symbolAliases: ["F_a", "F_{ax}"],
    aliases: ["Axial Thrust Load", "Shaft Axial Force", "Thrust Force"]
  },
  "A": STRESS_BASE_VARS.A,
  "I": STRESS_BASE_VARS.I,
  "J": STRESS_BASE_VARS.J,
  "Z": STRESS_BASE_VARS.Z,
  "Z_p": {
    name: "Polar Section Modulus",
    symbol: "Z_p",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Polar Section Modulus", "Torsional Section Modulus"],
    symbolAliases: ["Z_p", "J/r"],
    aliases: ["Polar Section Modulus", "Torsional Section Modulus"]
  },
  "E": STRESS_BASE_VARS.E,
  "G": STRESS_BASE_VARS.G,
  "S_y": STRESS_BASE_VARS.S_y,
  "S_ut": STRESS_BASE_VARS.S_ut,
  "S_e": STRESS_BASE_VARS.S_e,
  "sigma_b": STRESS_BASE_VARS.sigma_b,
  "sigma_vm": STRESS_BASE_VARS.sigma_vm,
  "tau": {
    ...STRESS_BASE_VARS.tau,
    name: "Torsional Shear Stress",
    nameAliases: ["Torsional Shear Stress", "Nominal Shear Stress", "Twist Shear Stress"],
    aliases: ["Torsional Shear Stress", "Nominal Shear Stress", "Twist Shear Stress"]
  }
});
