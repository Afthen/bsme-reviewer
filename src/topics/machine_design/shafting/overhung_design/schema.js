/**
 * src/topics/machine_design/shafting/overhung_design/schema.js
 * Schema for Overhung Shaft Design integrating the Three Distinct Checks:
 * (1) Strength, (2) Rigidity, and (3) Dynamics.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_OVERHUNG_VARS_DB = Object.freeze({
  "g": {
    name: "Gravitational Acceleration",
    symbol: "g",
    dimension: DIMENSIONS.ACCELERATION,
    unit: "m/s^2",
    isConstant: true,
    display: 9.81,
    nameAliases: ["Gravitational Acceleration", "Acceleration Due to Gravity"],
    symbolAliases: ["g"],
    aliases: ["Gravitational Acceleration", "Acceleration Due to Gravity", "g"]
  },
  "m": {
    name: "Overhung Rotor Mass",
    symbol: "m",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Overhung Rotor Mass", "Cantilevered Wheel Mass"],
    symbolAliases: ["m"],
    aliases: ["Overhung Rotor Mass", "Cantilevered Wheel Mass"]
  },
  "W": {
    name: "Overhung Rotor Weight",
    symbol: "W",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Overhung Rotor Weight", "Cantilevered Radial Load"],
    symbolAliases: ["W"],
    aliases: ["Overhung Rotor Weight", "Cantilevered Radial Load"]
  },
  "L": SHAFT_BASE_VARS.L,
  "a": {
    name: "Overhang Projection Length",
    symbol: "a",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Overhang Projection Length", "Cantilever Overhang Span"],
    symbolAliases: ["a"],
    aliases: ["Overhang Projection Length", "Cantilever Overhang Span"]
  },
  "L_tot": {
    name: "Total Overhung Shaft Length",
    symbol: "L_{tot}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Overhung Shaft Length", "Overall Span Plus Overhang"],
    symbolAliases: ["L_{tot}"],
    aliases: ["Total Overhung Shaft Length", "Overall Span Plus Overhang"]
  },
  "R_A": {
    name: "Inboard Bearing A Reaction",
    symbol: "R_A",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Inboard Bearing A Reaction", "Tail Bearing Reaction"],
    symbolAliases: ["R_A"],
    aliases: ["Inboard Bearing A Reaction", "Tail Bearing Reaction"]
  },
  "R_B": {
    name: "Outboard Bearing B Reaction",
    symbol: "R_B",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Outboard Bearing B Reaction", "Fulcrum Bearing Reaction"],
    symbolAliases: ["R_B"],
    aliases: ["Outboard Bearing B Reaction", "Fulcrum Bearing Reaction"]
  },
  "M_B": {
    name: "Peak Bending Moment at Bearing B",
    symbol: "M_B",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Peak Bending Moment at Bearing B", "Overhung Fulcrum Moment"],
    symbolAliases: ["M_B"],
    aliases: ["Peak Bending Moment at Bearing B", "Overhung Fulcrum Moment"]
  },
  "d": SHAFT_BASE_VARS.d,
  "I": SHAFT_BASE_VARS.I,
  "Z": SHAFT_BASE_VARS.Z,
  "Z_p": SHAFT_BASE_VARS.Z_p,
  "E": SHAFT_BASE_VARS.E,
  "S_y": SHAFT_BASE_VARS.S_y,
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "P": SHAFT_BASE_VARS.P,
  "T": SHAFT_BASE_VARS.T,
  "sigma_b": SHAFT_BASE_VARS.sigma_b,
  "tau": SHAFT_BASE_VARS.tau,
  "sigma_vm": SHAFT_BASE_VARS.sigma_vm,
  "n_DE": {
    name: "Strength Safety Factor (DE)",
    symbol: "n_{DE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Strength Safety Factor (DE)", "Static Yield Margin"],
    symbolAliases: ["n_{DE}"],
    aliases: ["Strength Safety Factor (DE)", "Static Yield Margin"]
  },
  "delta_tip": {
    name: "Overhung Tip Deflection",
    symbol: "\\delta_{tip}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Overhung Tip Deflection", "Free-End Lateral Deflection"],
    symbolAliases: ["\\delta_{tip}"],
    aliases: ["Overhung Tip Deflection", "Free-End Lateral Deflection"]
  },
  "theta_B": {
    name: "Shaft Slope at Bearing B",
    symbol: "\\theta_B",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Shaft Slope at Bearing B", "Fulcrum Bearing Slope"],
    symbolAliases: ["\\theta_B"],
    aliases: ["Shaft Slope at Bearing B", "Fulcrum Bearing Slope"]
  },
  "theta_tip": {
    name: "Shaft Slope at Overhung Tip",
    symbol: "\\theta_{tip}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Shaft Slope at Overhung Tip", "Free-End Angular Slope"],
    symbolAliases: ["\\theta_{tip}"],
    aliases: ["Shaft Slope at Overhung Tip", "Free-End Angular Slope"]
  },
  "delta_allow": {
    name: "Allowable Tip Deflection",
    symbol: "\\delta_{allow}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Allowable Tip Deflection", "Permissible End Deflection"],
    symbolAliases: ["\\delta_{allow}"],
    aliases: ["Allowable Tip Deflection", "Permissible End Deflection"]
  },
  "theta_allow": {
    name: "Allowable Fulcrum Bearing Slope",
    symbol: "\\theta_{allow}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Allowable Fulcrum Bearing Slope", "Bearing B Slope Limit"],
    symbolAliases: ["\\theta_{allow}"],
    aliases: ["Allowable Fulcrum Bearing Slope", "Bearing B Slope Limit"]
  },
  "n_delta": {
    name: "Tip Deflection Rigidity Margin",
    symbol: "n_{\\delta}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Tip Deflection Rigidity Margin", "Deflection Check Factor"],
    symbolAliases: ["n_{\\delta}"],
    aliases: ["Tip Deflection Rigidity Margin", "Deflection Check Factor"]
  },
  "n_theta": {
    name: "Bearing Slope Rigidity Margin",
    symbol: "n_{\\theta}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bearing Slope Rigidity Margin", "Alignment Check Factor"],
    symbolAliases: ["n_{\\theta}"],
    aliases: ["Bearing Slope Rigidity Margin", "Alignment Check Factor"]
  },
  "f_cr": {
    name: "Overhung Lateral Critical Frequency",
    symbol: "f_{cr}",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Overhung Lateral Critical Frequency", "Overhung Natural Frequency"],
    symbolAliases: ["f_{cr}"],
    aliases: ["Overhung Lateral Critical Frequency", "Overhung Natural Frequency"]
  },
  "omega_cr": {
    name: "Overhung Critical Angular Speed",
    symbol: "\\omega_{cr}",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rad/s",
    nameAliases: ["Overhung Critical Angular Speed", "Whirling Critical Speed (rad/s)"],
    symbolAliases: ["\\omega_{cr}"],
    aliases: ["Overhung Critical Angular Speed", "Whirling Critical Speed (rad/s)"]
  },
  "n_cr": {
    name: "Overhung Lateral Critical Speed",
    symbol: "n_{cr}",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    nameAliases: ["Overhung Lateral Critical Speed", "Critical Rotational Speed"],
    symbolAliases: ["n_{cr}"],
    aliases: ["Overhung Lateral Critical Speed", "Critical Rotational Speed"]
  },
  "r_cr": {
    name: "Operating-to-Critical Speed Ratio",
    symbol: "r_{cr}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Operating-to-Critical Speed Ratio", "Resonance Separation Ratio"],
    symbolAliases: ["r_{cr}"],
    aliases: ["Operating-to-Critical Speed Ratio", "Resonance Separation Ratio"]
  }
});
