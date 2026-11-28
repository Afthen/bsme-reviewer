/**
 * src/topics/machine_design/shafting/torsional_vibration/schema.js
 * Schema for Two-Rotor Stepped-Shaft Torsional Vibration & Nodal Dynamics.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_TORSIONAL_VIB_VARS_DB = Object.freeze({
  "m_1": {
    name: "Flywheel 1 Mass",
    symbol: "m_1",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Flywheel 1 Mass", "Rotor 1 Mass"],
    symbolAliases: ["m_1"],
    aliases: ["Flywheel 1 Mass", "Rotor 1 Mass"]
  },
  "m_2": {
    name: "Flywheel 2 Mass",
    symbol: "m_2",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Flywheel 2 Mass", "Rotor 2 Mass"],
    symbolAliases: ["m_2"],
    aliases: ["Flywheel 2 Mass", "Rotor 2 Mass"]
  },
  "R_1": {
    name: "Flywheel 1 Radius",
    symbol: "R_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "m",
    nameAliases: ["Flywheel 1 Radius", "Rotor 1 Outer Radius"],
    symbolAliases: ["R_1"],
    aliases: ["Flywheel 1 Radius", "Rotor 1 Outer Radius"]
  },
  "R_2": {
    name: "Flywheel 2 Radius",
    symbol: "R_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "m",
    nameAliases: ["Flywheel 2 Radius", "Rotor 2 Outer Radius"],
    symbolAliases: ["R_2"],
    aliases: ["Flywheel 2 Radius", "Rotor 2 Outer Radius"]
  },
  "I_m1": {
    name: "Rotor 1 Mass Moment of Inertia",
    symbol: "I_{m1}",
    dimension: DIMENSIONS.MASS_MOMENT_OF_INERTIA,
    unit: "kg*m^2",
    nameAliases: ["Rotor 1 Mass Moment of Inertia", "Flywheel 1 Polar Mass Inertia"],
    symbolAliases: ["I_{m1}"],
    aliases: ["Rotor 1 Mass Moment of Inertia", "Flywheel 1 Polar Mass Inertia"]
  },
  "I_m2": {
    name: "Rotor 2 Mass Moment of Inertia",
    symbol: "I_{m2}",
    dimension: DIMENSIONS.MASS_MOMENT_OF_INERTIA,
    unit: "kg*m^2",
    nameAliases: ["Rotor 2 Mass Moment of Inertia", "Flywheel 2 Polar Mass Inertia"],
    symbolAliases: ["I_{m2}"],
    aliases: ["Rotor 2 Mass Moment of Inertia", "Flywheel 2 Polar Mass Inertia"]
  },
  "I_eq": {
    name: "Equivalent Two-Rotor Mass Inertia",
    symbol: "I_{eq}",
    dimension: DIMENSIONS.MASS_MOMENT_OF_INERTIA,
    unit: "kg*m^2",
    nameAliases: ["Equivalent Two-Rotor Mass Inertia", "Reduced Torsional Inertia"],
    symbolAliases: ["I_{eq}"],
    aliases: ["Equivalent Two-Rotor Mass Inertia", "Reduced Torsional Inertia"]
  },
  "G": SHAFT_BASE_VARS.G,
  "d_1": {
    name: "Section 1 Shaft Diameter",
    symbol: "d_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section 1 Shaft Diameter", "Reference Segment Diameter"],
    symbolAliases: ["d_1"],
    aliases: ["Section 1 Shaft Diameter", "Reference Segment Diameter"]
  },
  "d_2": {
    name: "Section 2 Shaft Diameter",
    symbol: "d_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section 2 Shaft Diameter", "Stepped Segment Diameter"],
    symbolAliases: ["d_2"],
    aliases: ["Section 2 Shaft Diameter", "Stepped Segment Diameter"]
  },
  "L_1": {
    name: "Section 1 Length",
    symbol: "L_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section 1 Length", "First Segment Length"],
    symbolAliases: ["L_1"],
    aliases: ["Section 1 Length", "First Segment Length"]
  },
  "L_2": {
    name: "Section 2 Length",
    symbol: "L_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section 2 Length", "Second Segment Length"],
    symbolAliases: ["L_2"],
    aliases: ["Section 2 Length", "Second Segment Length"]
  },
  "L_tot": {
    name: "Total Rotor-to-Rotor Shaft Length",
    symbol: "L_{tot}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Rotor-to-Rotor Shaft Length", "Total Connecting Length"],
    symbolAliases: ["L_{tot}"],
    aliases: ["Total Rotor-to-Rotor Shaft Length", "Total Connecting Length"]
  },
  "J_1": {
    name: "Section 1 Polar Moment of Inertia",
    symbol: "J_1",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Section 1 Polar Moment of Inertia", "First Segment Polar Area Moment"],
    symbolAliases: ["J_1"],
    aliases: ["Section 1 Polar Moment of Inertia", "First Segment Polar Area Moment"]
  },
  "J_2": {
    name: "Section 2 Polar Moment of Inertia",
    symbol: "J_2",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Section 2 Polar Moment of Inertia", "Second Segment Polar Area Moment"],
    symbolAliases: ["J_2"],
    aliases: ["Section 2 Polar Moment of Inertia", "Second Segment Polar Area Moment"]
  },
  "L_eq": {
    name: "Torsionally Equivalent Shaft Length",
    symbol: "L_{eq}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Torsionally Equivalent Shaft Length", "Equivalent Uniform Length"],
    symbolAliases: ["L_{eq}"],
    aliases: ["Torsionally Equivalent Shaft Length", "Equivalent Uniform Length"]
  },
  "k_t1": {
    name: "Section 1 Torsional Stiffness",
    symbol: "k_{t1}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Section 1 Torsional Stiffness", "Segment 1 Torsional Spring Rate"],
    symbolAliases: ["k_{t1}"],
    aliases: ["Section 1 Torsional Stiffness", "Segment 1 Torsional Spring Rate"]
  },
  "k_t2": {
    name: "Section 2 Torsional Stiffness",
    symbol: "k_{t2}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Section 2 Torsional Stiffness", "Segment 2 Torsional Spring Rate"],
    symbolAliases: ["k_{t2}"],
    aliases: ["Section 2 Torsional Stiffness", "Segment 2 Torsional Spring Rate"]
  },
  "k_teq": {
    name: "Equivalent Torsional Stiffness",
    symbol: "k_{t,eq}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Equivalent Torsional Stiffness", "Series Shaft Torsional Stiffness"],
    symbolAliases: ["k_{t,eq}"],
    aliases: ["Equivalent Torsional Stiffness", "Series Shaft Torsional Stiffness"]
  },
  "f_nt": {
    name: "Torsional Natural Frequency",
    symbol: "f_{nt}",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Torsional Natural Frequency", "Torsional Resonance Frequency"],
    symbolAliases: ["f_{nt}"],
    aliases: ["Torsional Natural Frequency", "Torsional Resonance Frequency"]
  },
  "omega_nt": {
    name: "Torsional Natural Angular Frequency",
    symbol: "\\omega_{nt}",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rad/s",
    nameAliases: ["Torsional Natural Angular Frequency", "Torsional Circular Frequency"],
    symbolAliases: ["\\omega_{nt}"],
    aliases: ["Torsional Natural Angular Frequency", "Torsional Circular Frequency"]
  },
  "n_ct": {
    name: "Torsional Critical Speed",
    symbol: "n_{ct}",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    nameAliases: ["Torsional Critical Speed", "Torsional Critical RPM"],
    symbolAliases: ["n_{ct}"],
    aliases: ["Torsional Critical Speed", "Torsional Critical RPM"]
  },
  "L_n1": {
    name: "Node Distance from Rotor 1",
    symbol: "L_{n1}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Node Distance from Rotor 1", "Primary Nodal Span"],
    symbolAliases: ["L_{n1}"],
    aliases: ["Node Distance from Rotor 1", "Primary Nodal Span"]
  },
  "L_n2": {
    name: "Node Distance from Rotor 2",
    symbol: "L_{n2}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Node Distance from Rotor 2", "Secondary Nodal Span"],
    symbolAliases: ["L_{n2}"],
    aliases: ["Node Distance from Rotor 2", "Secondary Nodal Span"]
  },
  "theta_osc": {
    name: "Oscillatory Relative Twist Angle",
    symbol: "\\theta_{osc}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Oscillatory Relative Twist Angle", "Dynamic Twist Amplitude"],
    symbolAliases: ["\\theta_{osc}"],
    aliases: ["Oscillatory Relative Twist Angle", "Dynamic Twist Amplitude"]
  },
  "T_osc": {
    name: "Dynamic Torsional Torque Amplitude",
    symbol: "T_{osc}",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Dynamic Torsional Torque Amplitude", "Vibratory Torque Amplitude"],
    symbolAliases: ["T_{osc}"],
    aliases: ["Dynamic Torsional Torque Amplitude", "Vibratory Torque Amplitude"]
  },
  "tau_osc": {
    name: "Dynamic Vibratory Shear Stress",
    symbol: "\\tau_{osc}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Dynamic Vibratory Shear Stress", "Oscillatory Torsional Stress"],
    symbolAliases: ["\\tau_{osc}"],
    aliases: ["Dynamic Vibratory Shear Stress", "Oscillatory Torsional Stress"]
  }
});
