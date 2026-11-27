/**
 * src/topics/machine_design/stress/stress_concentration/schema.js
 * Schema for Stress Concentration Factors, Nominal Stress & Notch Sensitivity (Part VIII, Sec. 15).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const STRESS_CONCENTRATION_VARS_DB = Object.freeze({
  F: STRESS_BASE_VARS.F,
  T: STRESS_BASE_VARS.T,
  S_y: STRESS_BASE_VARS.S_y,

  "D_maj": {
    name: "Major Shaft Diameter",
    symbol: "D",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Major Shaft Diameter", "Large Shoulder Diameter"],
    symbolAliases: ["D", "D_{maj}"],
    aliases: ["Major Shaft Diameter", "Large Shoulder Diameter"]
  },
  "d_min": {
    name: "Minor Shaft Diameter",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Minor Shaft Diameter", "Reduced Fillet Diameter"],
    symbolAliases: ["d", "d_{min}"],
    aliases: ["Minor Shaft Diameter", "Reduced Fillet Diameter"]
  },
  "r_fil": {
    name: "Shoulder Fillet Radius",
    symbol: "r",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Shoulder Fillet Radius", "Notch Root Radius"],
    symbolAliases: ["r", "\\rho"],
    aliases: ["Shoulder Fillet Radius", "Notch Root Radius"]
  },
  "ratio_Dd": {
    name: "Step Diameter Ratio",
    symbol: "D/d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Step Diameter Ratio", "Shoulder Diameter Ratio"],
    symbolAliases: ["D/d"],
    aliases: ["Step Diameter Ratio", "Shoulder Diameter Ratio"]
  },
  "ratio_rd": {
    name: "Fillet-to-Diameter Ratio",
    symbol: "r/d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fillet-to-Diameter Ratio", "Notch Geometry Ratio"],
    symbolAliases: ["r/d"],
    aliases: ["Fillet-to-Diameter Ratio", "Notch Geometry Ratio"]
  },
  "A_min": {
    name: "Net Minor Section Area",
    symbol: "A_{min}",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Net Minor Section Area", "Minimum Circular Area"],
    symbolAliases: ["A_{min}", "A_0"],
    aliases: ["Net Minor Section Area", "Minimum Circular Area"]
  },
  "Z_pmin": {
    name: "Minor Polar Section Modulus",
    symbol: "Z_{p,min}",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Minor Polar Section Modulus", "Net Torsional Section Modulus"],
    symbolAliases: ["Z_{p,min}"],
    aliases: ["Minor Polar Section Modulus", "Net Torsional Section Modulus"]
  },
  "F_a": {
    name: "Alternating Axial Load",
    symbol: "F_a",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Alternating Axial Load", "Cyclic Axial Force Amplitude"],
    symbolAliases: ["F_a", "P_a"],
    aliases: ["Alternating Axial Load", "Cyclic Axial Force Amplitude"]
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
  "K_t": {
    name: "Theoretical Axial Stress Concentration Factor",
    symbol: "K_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Theoretical Axial Stress Concentration Factor", "Geometric Axial Concentration Factor"],
    symbolAliases: ["K_t"],
    aliases: ["Theoretical Axial Stress Concentration Factor", "Geometric Axial Concentration Factor"]
  },
  "K_ts": {
    name: "Theoretical Torsional Stress Concentration Factor",
    symbol: "K_{ts}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Theoretical Torsional Stress Concentration Factor", "Geometric Shear Concentration Factor"],
    symbolAliases: ["K_{ts}"],
    aliases: ["Theoretical Torsional Stress Concentration Factor", "Geometric Shear Concentration Factor"]
  },
  "q": {
    name: "Normal Notch Sensitivity",
    symbol: "q",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Normal Notch Sensitivity", "Axial Notch Sensitivity Factor"],
    symbolAliases: ["q"],
    aliases: ["Normal Notch Sensitivity", "Axial Notch Sensitivity Factor"]
  },
  "q_s": {
    name: "Shear Notch Sensitivity",
    symbol: "q_s",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Shear Notch Sensitivity", "Torsional Notch Sensitivity Factor"],
    symbolAliases: ["q_s"],
    aliases: ["Shear Notch Sensitivity", "Torsional Notch Sensitivity Factor"]
  },
  "K_f": {
    name: "Fatigue Normal Stress Concentration Factor",
    symbol: "K_f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fatigue Normal Stress Concentration Factor", "Effective Axial Fatigue Factor"],
    symbolAliases: ["K_f"],
    aliases: ["Fatigue Normal Stress Concentration Factor", "Effective Axial Fatigue Factor"]
  },
  "K_fs": {
    name: "Fatigue Shear Stress Concentration Factor",
    symbol: "K_{fs}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fatigue Shear Stress Concentration Factor", "Effective Torsional Fatigue Factor"],
    symbolAliases: ["K_{fs}"],
    aliases: ["Fatigue Shear Stress Concentration Factor", "Effective Torsional Fatigue Factor"]
  },
  "sigma_0": {
    name: "Nominal Axial Stress",
    symbol: "\\sigma_0",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Axial Stress", "Average Net-Section Stress"],
    symbolAliases: ["\\sigma_0", "\\sigma_{nom}"],
    aliases: ["Nominal Axial Stress", "Average Net-Section Stress"]
  },
  "sigma_max": {
    name: "Maximum Local Normal Stress",
    symbol: "\\sigma_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Local Normal Stress", "Peak Notch Normal Stress"],
    symbolAliases: ["\\sigma_{max}"],
    aliases: ["Maximum Local Normal Stress", "Peak Notch Normal Stress"]
  },
  "tau_0": {
    name: "Nominal Torsional Shear Stress",
    symbol: "\\tau_0",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Torsional Shear Stress", "Average Fillet Shear Stress"],
    symbolAliases: ["\\tau_0", "\\tau_{nom}"],
    aliases: ["Nominal Torsional Shear Stress", "Average Fillet Shear Stress"]
  },
  "tau_max": {
    name: "Maximum Local Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Local Shear Stress", "Peak Notch Shear Stress"],
    symbolAliases: ["\\tau_{max}"],
    aliases: ["Maximum Local Shear Stress", "Peak Notch Shear Stress"]
  },
  "sigma_a0": {
    name: "Nominal Alternating Normal Stress",
    symbol: "\\sigma_{a0}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Alternating Normal Stress", "Uncorrected Cyclic Axial Stress"],
    symbolAliases: ["\\sigma_{a0}"],
    aliases: ["Nominal Alternating Normal Stress", "Uncorrected Cyclic Axial Stress"]
  },
  "sigma_a_loc": {
    name: "Local Cyclic Normal Stress",
    symbol: "\\sigma_{a,loc}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Cyclic Normal Stress", "Notch-Adjusted Alternating Stress"],
    symbolAliases: ["\\sigma_{a,loc}"],
    aliases: ["Local Cyclic Normal Stress", "Notch-Adjusted Alternating Stress"]
  },
  "tau_a0": {
    name: "Nominal Alternating Shear Stress",
    symbol: "\\tau_{a0}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Alternating Shear Stress", "Uncorrected Cyclic Shear Stress"],
    symbolAliases: ["\\tau_{a0}"],
    aliases: ["Nominal Alternating Shear Stress", "Uncorrected Cyclic Shear Stress"]
  },
  "tau_a_loc": {
    name: "Local Cyclic Shear Stress",
    symbol: "\\tau_{a,loc}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Local Cyclic Shear Stress", "Notch-Adjusted Alternating Shear"],
    symbolAliases: ["\\tau_{a,loc}"],
    aliases: ["Local Cyclic Shear Stress", "Notch-Adjusted Alternating Shear"]
  },
  "sigma_vm_max": {
    name: "Peak Local von Mises Stress",
    symbol: "\\sigma'_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Peak Local von Mises Stress", "Notch-Root Equivalent Stress"],
    symbolAliases: ["\\sigma'_{max}"],
    aliases: ["Peak Local von Mises Stress", "Notch-Root Equivalent Stress"]
  },
  "n_loc": {
    name: "Local Yield Safety Factor",
    symbol: "n_{loc}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Local Yield Safety Factor", "Notch-Root Factor of Safety"],
    symbolAliases: ["n_{loc}"],
    aliases: ["Local Yield Safety Factor", "Notch-Root Factor of Safety"]
  }
});
