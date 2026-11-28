/**
 * src/topics/machine_design/shafting/power_and_loads/schema.js
 * Schema for 3D Shaft Power Transmission, Gear/Belt Forces, Bearing Reactions & Bending Moments.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_POWER_LOADS_VARS_DB = Object.freeze({
  "P_in": {
    name: "Input Drive Power",
    symbol: "P_{in}",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Input Drive Power", "Prime Mover Power"],
    symbolAliases: ["P_{in}"],
    aliases: ["Input Drive Power", "Prime Mover Power"]
  },
  "eta_m": {
    name: "Mechanical Transmission Efficiency",
    symbol: "\\eta_m",
    dimension: DIMENSIONS.PERCENTAGE,
    unit: "%",
    nameAliases: ["Mechanical Transmission Efficiency", "Drive Efficiency"],
    symbolAliases: ["\\eta_m", "\\eta"],
    aliases: ["Mechanical Transmission Efficiency", "Drive Efficiency"]
  },
  "P_out": {
    name: "Delivered Output Power",
    symbol: "P_{out}",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Delivered Output Power", "Net Output Power"],
    symbolAliases: ["P_{out}"],
    aliases: ["Delivered Output Power", "Net Output Power"]
  },
  "P_loss": {
    name: "Transmission Power Loss",
    symbol: "\\Delta P",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Transmission Power Loss", "Friction Power Loss"],
    symbolAliases: ["\\Delta P", "P_{loss}"],
    aliases: ["Transmission Power Loss", "Friction Power Loss"]
  },
  "K_s": {
    name: "Overload Service Factor",
    symbol: "K_s",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Overload Service Factor", "Application Service Factor"],
    symbolAliases: ["K_s"],
    aliases: ["Overload Service Factor", "Application Service Factor"]
  },
  "P_des": {
    name: "Design Shaft Power",
    symbol: "P_{des}",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Design Shaft Power", "Factored Design Power"],
    symbolAliases: ["P_{des}"],
    aliases: ["Design Shaft Power", "Factored Design Power"]
  },
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "T": SHAFT_BASE_VARS.T,
  "D_g": {
    name: "Mounted Gear Pitch Diameter",
    symbol: "D_g",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mounted Gear Pitch Diameter", "Gear Pitch Diameter"],
    symbolAliases: ["D_g"],
    aliases: ["Mounted Gear Pitch Diameter", "Gear Pitch Diameter"]
  },
  "phi_g": {
    name: "Gear Pressure Angle",
    symbol: "\\phi",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Gear Pressure Angle", "Transverse Pressure Angle"],
    symbolAliases: ["\\phi", "\\phi_t"],
    aliases: ["Gear Pressure Angle", "Transverse Pressure Angle"]
  },
  "psi_g": {
    name: "Helical Gear Helix Angle",
    symbol: "\\psi",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Helical Gear Helix Angle", "Gear Helix Angle"],
    symbolAliases: ["\\psi"],
    aliases: ["Helical Gear Helix Angle", "Gear Helix Angle"]
  },
  "W_t": {
    name: "Gear Tangential Load",
    symbol: "W_t",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Gear Tangential Load", "Tangential Tooth Force"],
    symbolAliases: ["W_t", "F_t"],
    aliases: ["Gear Tangential Load", "Tangential Tooth Force"]
  },
  "W_r": {
    name: "Gear Radial Separating Load",
    symbol: "W_r",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Gear Radial Separating Load", "Radial Tooth Force"],
    symbolAliases: ["W_r", "F_r"],
    aliases: ["Gear Radial Separating Load", "Radial Tooth Force"]
  },
  "F_ax": {
    name: "Helical Gear Axial Thrust",
    symbol: "F_{ax}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Helical Gear Axial Thrust", "Axial Gear Force"],
    symbolAliases: ["F_{ax}", "F_a"],
    aliases: ["Helical Gear Axial Thrust", "Axial Gear Force"]
  },
  "D_p": {
    name: "Pulley Pitch Diameter",
    symbol: "D_p",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Pulley Pitch Diameter", "Belt Sheave Diameter"],
    symbolAliases: ["D_p"],
    aliases: ["Pulley Pitch Diameter", "Belt Sheave Diameter"]
  },
  "F_1": {
    name: "Tight-Side Belt Tension",
    symbol: "F_1",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Tight-Side Belt Tension", "Belt Tight Tension"],
    symbolAliases: ["F_1", "T_1"],
    aliases: ["Tight-Side Belt Tension", "Belt Tight Tension"]
  },
  "F_2": {
    name: "Slack-Side Belt Tension",
    symbol: "F_2",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Slack-Side Belt Tension", "Belt Slack Tension"],
    symbolAliases: ["F_2", "T_2"],
    aliases: ["Slack-Side Belt Tension", "Belt Slack Tension"]
  },
  "k_b_tens": {
    name: "Belt Tension Ratio",
    symbol: "k_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Belt Tension Ratio", "Tight-to-Slack Tension Ratio"],
    symbolAliases: ["k_b"],
    aliases: ["Belt Tension Ratio", "Tight-to-Slack Tension Ratio"]
  },
  "F_b": {
    name: "Resultant Belt Bending Pull",
    symbol: "F_b",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Resultant Belt Bending Pull", "Total Pulley Radial Pull"],
    symbolAliases: ["F_b"],
    aliases: ["Resultant Belt Bending Pull", "Total Pulley Radial Pull"]
  },
  "L": SHAFT_BASE_VARS.L,
  "a_1": {
    name: "Gear Distance from Bearing A",
    symbol: "a_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Gear Distance from Bearing A", "Left Span to Gear"],
    symbolAliases: ["a_1"],
    aliases: ["Gear Distance from Bearing A", "Left Span to Gear"]
  },
  "b_1": {
    name: "Gear Distance from Bearing B",
    symbol: "b_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Gear Distance from Bearing B", "Right Span from Gear"],
    symbolAliases: ["b_1"],
    aliases: ["Gear Distance from Bearing B", "Right Span from Gear"]
  },
  "a_2": {
    name: "Pulley Distance from Bearing A",
    symbol: "a_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Pulley Distance from Bearing A", "Left Span to Pulley"],
    symbolAliases: ["a_2"],
    aliases: ["Pulley Distance from Bearing A", "Left Span to Pulley"]
  },
  "b_2": {
    name: "Pulley Distance from Bearing B",
    symbol: "b_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Pulley Distance from Bearing B", "Right Span from Pulley"],
    symbolAliases: ["b_2"],
    aliases: ["Pulley Distance from Bearing B", "Right Span from Pulley"]
  },
  "R_Av": {
    name: "Bearing A Vertical Reaction",
    symbol: "R_{Av}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing A Vertical Reaction", "Left Bearing Vertical Load"],
    symbolAliases: ["R_{Av}"],
    aliases: ["Bearing A Vertical Reaction", "Left Bearing Vertical Load"]
  },
  "R_Bv": {
    name: "Bearing B Vertical Reaction",
    symbol: "R_{Bv}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing B Vertical Reaction", "Right Bearing Vertical Load"],
    symbolAliases: ["R_{Bv}"],
    aliases: ["Bearing B Vertical Reaction", "Right Bearing Vertical Load"]
  },
  "R_Ah": {
    name: "Bearing A Horizontal Reaction",
    symbol: "R_{Ah}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing A Horizontal Reaction", "Left Bearing Horizontal Load"],
    symbolAliases: ["R_{Ah}"],
    aliases: ["Bearing A Horizontal Reaction", "Left Bearing Horizontal Load"]
  },
  "R_Bh": {
    name: "Bearing B Horizontal Reaction",
    symbol: "R_{Bh}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing B Horizontal Reaction", "Right Bearing Horizontal Load"],
    symbolAliases: ["R_{Bh}"],
    aliases: ["Bearing B Horizontal Reaction", "Right Bearing Horizontal Load"]
  },
  "R_A": {
    name: "Bearing A Radial Reaction",
    symbol: "R_A",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing A Radial Reaction", "Total Bearing A Load"],
    symbolAliases: ["R_A"],
    aliases: ["Bearing A Radial Reaction", "Total Bearing A Load"]
  },
  "R_B": {
    name: "Bearing B Radial Reaction",
    symbol: "R_B",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Bearing B Radial Reaction", "Total Bearing B Load"],
    symbolAliases: ["R_B"],
    aliases: ["Bearing B Radial Reaction", "Total Bearing B Load"]
  },
  "M_v1": {
    name: "Vertical Moment at Gear",
    symbol: "M_{v1}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Vertical Moment at Gear", "Vertical Bending Moment at Gear"],
    symbolAliases: ["M_{v1}"],
    aliases: ["Vertical Moment at Gear", "Vertical Bending Moment at Gear"]
  },
  "M_h1": {
    name: "Horizontal Moment at Gear",
    symbol: "M_{h1}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Horizontal Moment at Gear", "Horizontal Bending Moment at Gear"],
    symbolAliases: ["M_{h1}"],
    aliases: ["Horizontal Moment at Gear", "Horizontal Bending Moment at Gear"]
  },
  "M_1": {
    name: "Resultant Moment at Gear",
    symbol: "M_1",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Resultant Moment at Gear", "Combined Moment at Gear"],
    symbolAliases: ["M_1"],
    aliases: ["Resultant Moment at Gear", "Combined Moment at Gear"]
  },
  "M_v2": {
    name: "Vertical Moment at Pulley",
    symbol: "M_{v2}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Vertical Moment at Pulley", "Vertical Bending Moment at Pulley"],
    symbolAliases: ["M_{v2}"],
    aliases: ["Vertical Moment at Pulley", "Vertical Bending Moment at Pulley"]
  },
  "M_h2": {
    name: "Horizontal Moment at Pulley",
    symbol: "M_{h2}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Horizontal Moment at Pulley", "Horizontal Bending Moment at Pulley"],
    symbolAliases: ["M_{h2}"],
    aliases: ["Horizontal Moment at Pulley", "Horizontal Bending Moment at Pulley"]
  },
  "M_2": {
    name: "Resultant Moment at Pulley",
    symbol: "M_2",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Resultant Moment at Pulley", "Combined Moment at Pulley"],
    symbolAliases: ["M_2"],
    aliases: ["Resultant Moment at Pulley", "Combined Moment at Pulley"]
  }
});
