/**
 * src/topics/machine_design/shafting/rigidity_deflection/schema.js
 * Schema for Shaft Lateral Rigidity: Horizontal/Vertical Deflection, Bearing Slope,
 * Castigliano Strain Energy, and Deflection- vs. Strength-Controlled Diameter Sizing.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_RIGIDITY_DEFLECTION_VARS_DB = Object.freeze({
  "L": SHAFT_BASE_VARS.L,
  "a": {
    name: "Load Distance from Bearing A",
    symbol: "a",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Load Distance from Bearing A", "Left Span Segment"],
    symbolAliases: ["a"],
    aliases: ["Load Distance from Bearing A", "Left Span Segment"]
  },
  "b": {
    name: "Load Distance from Bearing B",
    symbol: "b",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Load Distance from Bearing B", "Right Span Segment"],
    symbolAliases: ["b"],
    aliases: ["Load Distance from Bearing B", "Right Span Segment"]
  },
  "F_v": {
    name: "Vertical Transverse Load",
    symbol: "F_v",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Vertical Transverse Load", "Vertical Radial Force"],
    symbolAliases: ["F_v"],
    aliases: ["Vertical Transverse Load", "Vertical Radial Force"]
  },
  "F_h": {
    name: "Horizontal Transverse Load",
    symbol: "F_h",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Horizontal Transverse Load", "Horizontal Radial Force"],
    symbolAliases: ["F_h"],
    aliases: ["Horizontal Transverse Load", "Horizontal Radial Force"]
  },
  "F": {
    name: "Resultant Transverse Load",
    symbol: "F",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Resultant Transverse Load", "Total Radial Load"],
    symbolAliases: ["F"],
    aliases: ["Resultant Transverse Load", "Total Radial Load"]
  },
  "d": SHAFT_BASE_VARS.d,
  "E": SHAFT_BASE_VARS.E,
  "I": SHAFT_BASE_VARS.I,
  "Z": SHAFT_BASE_VARS.Z,
  "delta_v": {
    name: "Vertical Plane Deflection",
    symbol: "\\delta_v",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Vertical Plane Deflection", "Vertical Lateral Deflection"],
    symbolAliases: ["\\delta_v"],
    aliases: ["Vertical Plane Deflection", "Vertical Lateral Deflection"]
  },
  "delta_h": {
    name: "Horizontal Plane Deflection",
    symbol: "\\delta_h",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Horizontal Plane Deflection", "Horizontal Lateral Deflection"],
    symbolAliases: ["\\delta_h"],
    aliases: ["Horizontal Plane Deflection", "Horizontal Lateral Deflection"]
  },
  "delta": {
    name: "Resultant Shaft Deflection at Load",
    symbol: "\\delta",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Resultant Shaft Deflection at Load", "Lateral Shaft Deflection"],
    symbolAliases: ["\\delta", "y"],
    aliases: ["Resultant Shaft Deflection at Load", "Lateral Shaft Deflection"]
  },
  "theta_A": {
    name: "Slope at Bearing A",
    symbol: "\\theta_A",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Slope at Bearing A", "Left Bearing Angular Slope"],
    symbolAliases: ["\\theta_A"],
    aliases: ["Slope at Bearing A", "Left Bearing Angular Slope"]
  },
  "theta_B": {
    name: "Slope at Bearing B",
    symbol: "\\theta_B",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Slope at Bearing B", "Right Bearing Angular Slope"],
    symbolAliases: ["\\theta_B"],
    aliases: ["Slope at Bearing B", "Right Bearing Angular Slope"]
  },
  "U_b": {
    name: "Flexural Strain Energy",
    symbol: "U_b",
    dimension: DIMENSIONS.ENERGY,
    unit: "J",
    nameAliases: ["Flexural Strain Energy", "Bending Elastic Strain Energy"],
    symbolAliases: ["U_b", "U"],
    aliases: ["Flexural Strain Energy", "Bending Elastic Strain Energy"]
  },
  "M": SHAFT_BASE_VARS.M,
  "sigma_b": SHAFT_BASE_VARS.sigma_b,
  "sigma_allow": {
    name: "Allowable Bending Stress",
    symbol: "\\sigma_{allow}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Allowable Bending Stress", "Permissible Flexural Stress"],
    symbolAliases: ["\\sigma_{allow}"],
    aliases: ["Allowable Bending Stress", "Permissible Flexural Stress"]
  },
  "Z_str": {
    name: "Strength-Required Section Modulus",
    symbol: "Z_{str}",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Strength-Required Section Modulus", "Flexural Modulus Demand"],
    symbolAliases: ["Z_{str}"],
    aliases: ["Strength-Required Section Modulus", "Flexural Modulus Demand"]
  },
  "d_str": {
    name: "Strength-Governed Shaft Diameter",
    symbol: "d_{str}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Strength-Governed Shaft Diameter", "Stress-Limited Diameter"],
    symbolAliases: ["d_{str}"],
    aliases: ["Strength-Governed Shaft Diameter", "Stress-Limited Diameter"]
  },
  "delta_allow": {
    name: "Allowable Lateral Deflection",
    symbol: "\\delta_{allow}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Allowable Lateral Deflection", "Permissible Shaft Deflection"],
    symbolAliases: ["\\delta_{allow}"],
    aliases: ["Allowable Lateral Deflection", "Permissible Shaft Deflection"]
  },
  "I_rig": {
    name: "Deflection-Required Moment of Inertia",
    symbol: "I_{rig}",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Deflection-Required Moment of Inertia", "Stiffness-Governed Inertia"],
    symbolAliases: ["I_{rig}"],
    aliases: ["Deflection-Required Moment of Inertia", "Stiffness-Governed Inertia"]
  },
  "d_rig": {
    name: "Deflection-Governed Shaft Diameter",
    symbol: "d_{rig}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Deflection-Governed Shaft Diameter", "Rigidity-Limited Diameter"],
    symbolAliases: ["d_{rig}"],
    aliases: ["Deflection-Governed Shaft Diameter", "Rigidity-Limited Diameter"]
  },
  "theta_allow": {
    name: "Allowable Bearing Slope",
    symbol: "\\theta_{allow}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Allowable Bearing Slope", "Bearing Misalignment Limit"],
    symbolAliases: ["\\theta_{allow}"],
    aliases: ["Allowable Bearing Slope", "Bearing Misalignment Limit"]
  },
  "I_slope": {
    name: "Slope-Required Moment of Inertia",
    symbol: "I_{\\theta}",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Slope-Required Moment of Inertia", "Alignment-Governed Inertia"],
    symbolAliases: ["I_{\\theta}"],
    aliases: ["Slope-Required Moment of Inertia", "Alignment-Governed Inertia"]
  },
  "n_delta": {
    name: "Deflection Rigidity Factor",
    symbol: "n_{\\delta}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Deflection Rigidity Factor", "Lateral Deflection Margin"],
    symbolAliases: ["n_{\\delta}"],
    aliases: ["Deflection Rigidity Factor", "Lateral Deflection Margin"]
  },
  "n_theta": {
    name: "Bearing Alignment Factor",
    symbol: "n_{\\theta}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bearing Alignment Factor", "Slope Alignment Margin"],
    symbolAliases: ["n_{\\theta}"],
    aliases: ["Bearing Alignment Factor", "Slope Alignment Margin"]
  },
  "n_str": {
    name: "Bending Strength Margin",
    symbol: "n_{str}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bending Strength Margin", "Flexural Safety Factor"],
    symbolAliases: ["n_{str}"],
    aliases: ["Bending Strength Margin", "Flexural Safety Factor"]
  }
});
