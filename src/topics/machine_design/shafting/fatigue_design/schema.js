/**
 * src/topics/machine_design/shafting/fatigue_design/schema.js
 * Schema for Rotating Shaft Fatigue Design (Stepped Shoulders, Notch Sensitivity, Marin Limit, DE Criteria).
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_FATIGUE_VARS_DB = Object.freeze({
  "D_maj": {
    name: "Shoulder Major Diameter",
    symbol: "D",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Shoulder Major Diameter", "Stepped Major Diameter"],
    symbolAliases: ["D"],
    aliases: ["Shoulder Major Diameter", "Stepped Major Diameter"]
  },
  "d": SHAFT_BASE_VARS.d,
  "r_f": {
    name: "Shoulder Fillet Radius",
    symbol: "r_f",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Shoulder Fillet Radius", "Transition Fillet Radius"],
    symbolAliases: ["r_f", "r"],
    aliases: ["Shoulder Fillet Radius", "Transition Fillet Radius"]
  },
  "r_Dd": {
    name: "Shoulder Diameter Ratio",
    symbol: "D/d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Shoulder Diameter Ratio", "Step Ratio"],
    symbolAliases: ["D/d"],
    aliases: ["Shoulder Diameter Ratio", "Step Ratio"]
  },
  "r_rd": {
    name: "Fillet-to-Diameter Ratio",
    symbol: "r/d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fillet-to-Diameter Ratio", "Notch Geometry Ratio"],
    symbolAliases: ["r/d"],
    aliases: ["Fillet-to-Diameter Ratio", "Notch Geometry Ratio"]
  },
  "K_t": {
    name: "Bending Stress Concentration Factor",
    symbol: "K_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bending Stress Concentration Factor", "Theoretical Bending Kt"],
    symbolAliases: ["K_t"],
    aliases: ["Bending Stress Concentration Factor", "Theoretical Bending Kt"]
  },
  "K_ts": {
    name: "Torsional Stress Concentration Factor",
    symbol: "K_{ts}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Torsional Stress Concentration Factor", "Theoretical Shear Kts"],
    symbolAliases: ["K_{ts}"],
    aliases: ["Torsional Stress Concentration Factor", "Theoretical Shear Kts"]
  },
  "q": {
    name: "Bending Notch Sensitivity",
    symbol: "q",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bending Notch Sensitivity", "Flexural Notch Sensitivity"],
    symbolAliases: ["q"],
    aliases: ["Bending Notch Sensitivity", "Flexural Notch Sensitivity"]
  },
  "q_s": {
    name: "Shear Notch Sensitivity",
    symbol: "q_s",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Shear Notch Sensitivity", "Torsional Notch Sensitivity"],
    symbolAliases: ["q_s"],
    aliases: ["Shear Notch Sensitivity", "Torsional Notch Sensitivity"]
  },
  "K_f": {
    name: "Bending Fatigue Concentration Factor",
    symbol: "K_f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bending Fatigue Concentration Factor", "Fatigue Notch Factor Kf"],
    symbolAliases: ["K_f"],
    aliases: ["Bending Fatigue Concentration Factor", "Fatigue Notch Factor Kf"]
  },
  "K_fs": {
    name: "Torsional Fatigue Concentration Factor",
    symbol: "K_{fs}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Torsional Fatigue Concentration Factor", "Fatigue Shear Notch Factor Kfs"],
    symbolAliases: ["K_{fs}"],
    aliases: ["Torsional Fatigue Concentration Factor", "Fatigue Shear Notch Factor Kfs"]
  },
  "S_ut": SHAFT_BASE_VARS.S_ut,
  "S_y": SHAFT_BASE_VARS.S_y,
  "S_ep": {
    name: "Uncorrected Endurance Limit",
    symbol: "S_e'",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Uncorrected Endurance Limit", "Rotary-Beam Endurance Limit"],
    symbolAliases: ["S_e'"],
    aliases: ["Uncorrected Endurance Limit", "Rotary-Beam Endurance Limit"]
  },
  "k_a": {
    name: "Surface Condition Factor",
    symbol: "k_a",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Surface Condition Factor", "Marin Surface Factor"],
    symbolAliases: ["k_a"],
    aliases: ["Surface Condition Factor", "Marin Surface Factor"]
  },
  "k_b": {
    name: "Size Modification Factor",
    symbol: "k_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Size Modification Factor", "Marin Size Factor"],
    symbolAliases: ["k_b"],
    aliases: ["Size Modification Factor", "Marin Size Factor"]
  },
  "k_c": {
    name: "Load Modification Factor",
    symbol: "k_c",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Load Modification Factor", "Marin Load Factor"],
    symbolAliases: ["k_c"],
    aliases: ["Load Modification Factor", "Marin Load Factor"]
  },
  "k_d_temp": {
    name: "Temperature Modification Factor",
    symbol: "k_d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Temperature Modification Factor", "Marin Temperature Factor"],
    symbolAliases: ["k_d"],
    aliases: ["Temperature Modification Factor", "Marin Temperature Factor"]
  },
  "k_e_rel": {
    name: "Reliability Modification Factor",
    symbol: "k_e",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Reliability Modification Factor", "Marin Reliability Factor"],
    symbolAliases: ["k_e"],
    aliases: ["Reliability Modification Factor", "Marin Reliability Factor"]
  },
  "S_e": SHAFT_BASE_VARS.S_e,
  "M_a": {
    name: "Alternating Bending Moment",
    symbol: "M_a",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Alternating Bending Moment", "Reversed Moment Amplitude"],
    symbolAliases: ["M_a"],
    aliases: ["Alternating Bending Moment", "Reversed Moment Amplitude"]
  },
  "M_m": {
    name: "Mean Bending Moment",
    symbol: "M_m",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Mean Bending Moment", "Steady Bending Moment"],
    symbolAliases: ["M_m"],
    aliases: ["Mean Bending Moment", "Steady Bending Moment"]
  },
  "T_a": {
    name: "Alternating Torque",
    symbol: "T_a",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Alternating Torque", "Cyclic Torque Amplitude"],
    symbolAliases: ["T_a"],
    aliases: ["Alternating Torque", "Cyclic Torque Amplitude"]
  },
  "T_m": {
    name: "Mean Transmitted Torque",
    symbol: "T_m",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Mean Transmitted Torque", "Steady Shaft Torque"],
    symbolAliases: ["T_m"],
    aliases: ["Mean Transmitted Torque", "Steady Shaft Torque"]
  },
  "sigma_a": {
    name: "Local Alternating Bending Stress",
    symbol: "\\sigma_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Alternating Bending Stress", "Notched Alternating Flexural Stress"],
    symbolAliases: ["\\sigma_a"],
    aliases: ["Local Alternating Bending Stress", "Notched Alternating Flexural Stress"]
  },
  "sigma_m": {
    name: "Local Mean Bending Stress",
    symbol: "\\sigma_m",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Mean Bending Stress", "Notched Mean Flexural Stress"],
    symbolAliases: ["\\sigma_m"],
    aliases: ["Local Mean Bending Stress", "Notched Mean Flexural Stress"]
  },
  "tau_a": {
    name: "Local Alternating Torsional Shear",
    symbol: "\\tau_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Alternating Torsional Shear", "Notched Alternating Shear Stress"],
    symbolAliases: ["\\tau_a"],
    aliases: ["Local Alternating Torsional Shear", "Notched Alternating Shear Stress"]
  },
  "tau_m": {
    name: "Local Mean Torsional Shear",
    symbol: "\\tau_m",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Mean Torsional Shear", "Notched Mean Shear Stress"],
    symbolAliases: ["\\tau_m"],
    aliases: ["Local Mean Torsional Shear", "Notched Mean Shear Stress"]
  },
  "sigma_vm_a": {
    name: "von Mises Alternating Stress",
    symbol: "\\sigma'_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["von Mises Alternating Stress", "Equivalent Alternating Stress"],
    symbolAliases: ["\\sigma'_a"],
    aliases: ["von Mises Alternating Stress", "Equivalent Alternating Stress"]
  },
  "sigma_vm_m": {
    name: "von Mises Mean Stress",
    symbol: "\\sigma'_m",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["von Mises Mean Stress", "Equivalent Midrange Stress"],
    symbolAliases: ["\\sigma'_m"],
    aliases: ["von Mises Mean Stress", "Equivalent Midrange Stress"]
  },
  "A_eq": {
    name: "Alternating Fatigue Moment Parameter",
    symbol: "A_{eq}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Alternating Fatigue Moment Parameter", "Shigley Alternating Load Term"],
    symbolAliases: ["A_{eq}", "A"],
    aliases: ["Alternating Fatigue Moment Parameter", "Shigley Alternating Load Term"]
  },
  "B_eq": {
    name: "Midrange Fatigue Moment Parameter",
    symbol: "B_{eq}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Midrange Fatigue Moment Parameter", "Shigley Midrange Load Term"],
    symbolAliases: ["B_{eq}", "B"],
    aliases: ["Midrange Fatigue Moment Parameter", "Shigley Midrange Load Term"]
  },
  "Z_p": SHAFT_BASE_VARS.Z_p,
  "n_DG": {
    name: "DE-Goodman Fatigue Safety Factor",
    symbol: "n_{DG}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["DE-Goodman Fatigue Safety Factor", "Goodman Shaft Safety Factor"],
    symbolAliases: ["n_{DG}"],
    aliases: ["DE-Goodman Fatigue Safety Factor", "Goodman Shaft Safety Factor"]
  },
  "n_DS": {
    name: "DE-Soderberg Fatigue Safety Factor",
    symbol: "n_{DS}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["DE-Soderberg Fatigue Safety Factor", "Soderberg Shaft Safety Factor"],
    symbolAliases: ["n_{DS}"],
    aliases: ["DE-Soderberg Fatigue Safety Factor", "Soderberg Shaft Safety Factor"]
  },
  "n_AE": {
    name: "DE-ASME-Elliptic Fatigue Safety Factor",
    symbol: "n_{AE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["DE-ASME-Elliptic Fatigue Safety Factor", "ASME Elliptic Safety Factor"],
    symbolAliases: ["n_{AE}"],
    aliases: ["DE-ASME-Elliptic Fatigue Safety Factor", "ASME Elliptic Safety Factor"]
  },
  "n_Gb": {
    name: "DE-Gerber Fatigue Safety Factor",
    symbol: "n_{Gb}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["DE-Gerber Fatigue Safety Factor", "Gerber Shaft Safety Factor"],
    symbolAliases: ["n_{Gb}"],
    aliases: ["DE-Gerber Fatigue Safety Factor", "Gerber Shaft Safety Factor"]
  },
  "n_y": {
    name: "Langer Static Yield Safety Factor",
    symbol: "n_y",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Langer Static Yield Safety Factor", "First-Cycle Yield Check Factor"],
    symbolAliases: ["n_y"],
    aliases: ["Langer Static Yield Safety Factor", "First-Cycle Yield Check Factor"]
  }
});
