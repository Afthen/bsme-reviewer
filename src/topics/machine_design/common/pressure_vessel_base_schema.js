/**
 * src/topics/machine_design/common/pressure_vessel_base_schema.js
 * Shared Machine Design pressure vessel variable schema definitions.
 * Designed for reuse across Thin-Walled, Thick-Walled (Lamé), Compound, and ASME Code topics.
 * References: ASME Boiler and Pressure Vessel Code Section VIII Div 1, Shigley, Beer & Johnston.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const PRESSURE_VESSEL_BASE_VARS = Object.freeze({
  "p_i": {
    name: "Internal Pressure",
    symbol: "p_i",
    dimension: DIMENSIONS.PRESSURE,
    unit: "MPa",
    nameAliases: ["Internal Pressure", "Internal Operating Pressure", "Gauge Pressure"],
    symbolAliases: ["p_i", "P_i", "p"],
    aliases: ["Internal Pressure", "Internal Operating Pressure", "Gauge Pressure"]
  },
  "p_o": {
    name: "External Pressure",
    symbol: "p_o",
    dimension: DIMENSIONS.PRESSURE,
    unit: "MPa",
    nameAliases: ["External Pressure", "Outer Pressure", "External Operating Pressure"],
    symbolAliases: ["p_o", "P_o"],
    aliases: ["External Pressure", "Outer Pressure", "External Operating Pressure"]
  },
  "D_i": {
    name: "Inner Diameter",
    symbol: "D_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Inner Diameter", "Inside Diameter", "Internal Diameter"],
    symbolAliases: ["D_i", "d_i", "ID"],
    aliases: ["Inner Diameter", "Inside Diameter", "Internal Diameter"]
  },
  "D_o": {
    name: "Outer Diameter",
    symbol: "D_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Outer Diameter", "Outside Diameter", "External Diameter"],
    symbolAliases: ["D_o", "d_o", "OD"],
    aliases: ["Outer Diameter", "Outside Diameter", "External Diameter"]
  },
  "D_m": {
    name: "Mean Diameter",
    symbol: "D_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mean Diameter", "Average Diameter", "Mid-Wall Diameter"],
    symbolAliases: ["D_m", "d_m"],
    aliases: ["Mean Diameter", "Average Diameter", "Mid-Wall Diameter"]
  },
  "r_i": {
    name: "Inner Radius",
    symbol: "r_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Inner Radius", "Inside Radius", "Internal Radius"],
    symbolAliases: ["r_i", "R_i"],
    aliases: ["Inner Radius", "Inside Radius", "Internal Radius"]
  },
  "r_o": {
    name: "Outer Radius",
    symbol: "r_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Outer Radius", "Outside Radius", "External Radius"],
    symbolAliases: ["r_o", "R_o"],
    aliases: ["Outer Radius", "Outside Radius", "External Radius"]
  },
  "r_m": {
    name: "Mean Radius",
    symbol: "r_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mean Radius", "Average Radius", "Mid-Wall Radius"],
    symbolAliases: ["r_m", "R_m"],
    aliases: ["Mean Radius", "Average Radius", "Mid-Wall Radius"]
  },
  "t": {
    name: "Wall Thickness",
    symbol: "t",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Wall Thickness", "Shell Thickness", "Minimum Wall Thickness"],
    symbolAliases: ["t", "h_w"],
    aliases: ["Wall Thickness", "Shell Thickness", "Minimum Wall Thickness"]
  },
  "c_a": {
    name: "Corrosion Allowance",
    symbol: "c_a",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Corrosion Allowance", "Corrosion Margin"],
    symbolAliases: ["c_a", "CA"],
    aliases: ["Corrosion Allowance", "Corrosion Margin"]
  },
  "t_nom": {
    name: "Nominal Wall Thickness",
    symbol: "t_{nom}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Nominal Wall Thickness", "Gross Plate Thickness", "Total Shell Thickness"],
    symbolAliases: ["t_{nom}", "t_g"],
    aliases: ["Nominal Wall Thickness", "Gross Plate Thickness", "Total Shell Thickness"]
  },
  "L": {
    name: "Cylinder Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Cylinder Length", "Vessel Length", "Shell Length"],
    symbolAliases: ["L", "L_v"],
    aliases: ["Cylinder Length", "Vessel Length", "Shell Length"]
  },
  "sigma_h": {
    name: "Circumferential Hoop Stress",
    symbol: "\\sigma_h",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Circumferential Hoop Stress", "Hoop Stress", "Tangential Membrane Stress"],
    symbolAliases: ["\\sigma_h", "\\sigma_t", "\\sigma_1"],
    aliases: ["Circumferential Hoop Stress", "Hoop Stress", "Tangential Membrane Stress"]
  },
  "sigma_L": {
    name: "Longitudinal Axial Stress",
    symbol: "\\sigma_L",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Longitudinal Axial Stress", "Longitudinal Stress", "Axial Membrane Stress"],
    symbolAliases: ["\\sigma_L", "\\sigma_a", "\\sigma_2"],
    aliases: ["Longitudinal Axial Stress", "Longitudinal Stress", "Axial Membrane Stress"]
  },
  "sigma_s": {
    name: "Spherical Membrane Stress",
    symbol: "\\sigma_s",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Spherical Membrane Stress", "Spherical Wall Stress", "Spherical Shell Stress"],
    symbolAliases: ["\\sigma_s", "\\sigma_{sph}"],
    aliases: ["Spherical Membrane Stress", "Spherical Wall Stress", "Spherical Shell Stress"]
  },
  "tau_max_in": {
    name: "Maximum In-Plane Shear Stress",
    symbol: "\\tau_{max,in}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum In-Plane Shear Stress", "In-Plane Shear Stress"],
    symbolAliases: ["\\tau_{max,in}", "\\tau_{in}"],
    aliases: ["Maximum In-Plane Shear Stress", "In-Plane Shear Stress"]
  },
  "tau_max": {
    name: "Maximum Absolute Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Absolute Shear Stress", "Maximum Shear Stress", "Tresca Shear Stress"],
    symbolAliases: ["\\tau_{max}", "s_{s,max}"],
    aliases: ["Maximum Absolute Shear Stress", "Maximum Shear Stress", "Tresca Shear Stress"]
  },
  "F_L": {
    name: "End-Cap Blowoff Thrust",
    symbol: "F_L",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["End-Cap Blowoff Thrust", "Axial Blowoff Force", "End Closure Thrust"],
    symbolAliases: ["F_L", "P_{end}", "F_{end}"],
    aliases: ["End-Cap Blowoff Thrust", "Axial Blowoff Force", "End Closure Thrust"]
  },
  "delta_D": {
    name: "Diametral Expansion",
    symbol: "\\Delta D",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Diametral Expansion", "Diameter Increase", "Radial Dilation"],
    symbolAliases: ["\\Delta D", "\\Delta d", "\\delta_D"],
    aliases: ["Diametral Expansion", "Diameter Increase", "Radial Dilation"]
  },
  "delta_L": {
    name: "Longitudinal Elongation",
    symbol: "\\Delta L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Longitudinal Elongation", "Length Increase", "Axial Elongation"],
    symbolAliases: ["\\Delta L", "\\delta_L"],
    aliases: ["Longitudinal Elongation", "Length Increase", "Axial Elongation"]
  },
  "E_w": {
    name: "Weld Joint Efficiency",
    symbol: "E_w",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Weld Joint Efficiency", "Joint Efficiency Factor", "Weld Efficiency"],
    symbolAliases: ["E_w", "\\eta_w", "E"],
    aliases: ["Weld Joint Efficiency", "Joint Efficiency Factor", "Weld Efficiency"]
  }
});
