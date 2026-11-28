/**
 * src/topics/machine_design/shafting/critical_speed/schema.js
 * Schema for Lateral Critical Speed (Rayleigh & Dunkerley), Unbalance & Jeffcott Whirl.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_CRITICAL_SPEED_VARS_DB = Object.freeze({
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
  "m_1": {
    name: "Rotor 1 Mass",
    symbol: "m_1",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Rotor 1 Mass", "Primary Disc Mass"],
    symbolAliases: ["m_1"],
    aliases: ["Rotor 1 Mass", "Primary Disc Mass"]
  },
  "m_2": {
    name: "Rotor 2 Mass",
    symbol: "m_2",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Rotor 2 Mass", "Secondary Disc Mass"],
    symbolAliases: ["m_2"],
    aliases: ["Rotor 2 Mass", "Secondary Disc Mass"]
  },
  "W_1": {
    name: "Rotor 1 Weight",
    symbol: "W_1",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Rotor 1 Weight", "Primary Rotor Gravity Load"],
    symbolAliases: ["W_1"],
    aliases: ["Rotor 1 Weight", "Primary Rotor Gravity Load"]
  },
  "delta_1": {
    name: "Static Deflection at Rotor 1",
    symbol: "\\delta_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Static Deflection at Rotor 1", "Disc 1 Static Sag"],
    symbolAliases: ["\\delta_1"],
    aliases: ["Static Deflection at Rotor 1", "Disc 1 Static Sag"]
  },
  "delta_2": {
    name: "Static Deflection at Rotor 2",
    symbol: "\\delta_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Static Deflection at Rotor 2", "Disc 2 Static Sag"],
    symbolAliases: ["\\delta_2"],
    aliases: ["Static Deflection at Rotor 2", "Disc 2 Static Sag"]
  },
  "k_1": {
    name: "Shaft Flexural Stiffness at Rotor 1",
    symbol: "k_1",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    nameAliases: ["Shaft Flexural Stiffness at Rotor 1", "Lateral Stiffness at Disc 1"],
    symbolAliases: ["k_1"],
    aliases: ["Shaft Flexural Stiffness at Rotor 1", "Lateral Stiffness at Disc 1"]
  },
  "f_1": {
    name: "Single-Mass Critical Frequency (Rotor 1)",
    symbol: "f_1",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Single-Mass Critical Frequency (Rotor 1)", "Rotor 1 Isolated Critical Frequency"],
    symbolAliases: ["f_1"],
    aliases: ["Single-Mass Critical Frequency (Rotor 1)", "Rotor 1 Isolated Critical Frequency"]
  },
  "f_2": {
    name: "Single-Mass Critical Frequency (Rotor 2)",
    symbol: "f_2",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Single-Mass Critical Frequency (Rotor 2)", "Rotor 2 Isolated Critical Frequency"],
    symbolAliases: ["f_2"],
    aliases: ["Single-Mass Critical Frequency (Rotor 2)", "Rotor 2 Isolated Critical Frequency"]
  },
  "f_D": {
    name: "Dunkerley Critical Frequency",
    symbol: "f_D",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Dunkerley Critical Frequency", "Lower-Bound Critical Frequency"],
    symbolAliases: ["f_D"],
    aliases: ["Dunkerley Critical Frequency", "Lower-Bound Critical Frequency"]
  },
  "f_R": {
    name: "Rayleigh Critical Frequency",
    symbol: "f_R",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Rayleigh Critical Frequency", "Upper-Bound Energy Critical Frequency"],
    symbolAliases: ["f_R"],
    aliases: ["Rayleigh Critical Frequency", "Upper-Bound Energy Critical Frequency"]
  },
  "omega_D": {
    name: "Dunkerley Critical Angular Speed",
    symbol: "\\omega_D",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rad/s",
    nameAliases: ["Dunkerley Critical Angular Speed", "Critical Angular Speed"],
    symbolAliases: ["\\omega_D"],
    aliases: ["Dunkerley Critical Angular Speed", "Critical Angular Speed"]
  },
  "n_D": {
    name: "Dunkerley Critical Speed",
    symbol: "n_D",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    nameAliases: ["Dunkerley Critical Speed", "First Lateral Critical Speed"],
    symbolAliases: ["n_D", "N_{cr}"],
    aliases: ["Dunkerley Critical Speed", "First Lateral Critical Speed"]
  },
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "f_op": {
    name: "Operating Rotational Frequency",
    symbol: "f_{op}",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Operating Rotational Frequency", "Synchronous Excitation Frequency"],
    symbolAliases: ["f_{op}"],
    aliases: ["Operating Rotational Frequency", "Synchronous Excitation Frequency"]
  },
  "r_cr": {
    name: "Critical Speed Separation Ratio",
    symbol: "r_{cr}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Critical Speed Separation Ratio", "Operating-to-Critical Speed Ratio"],
    symbolAliases: ["r_{cr}"],
    aliases: ["Critical Speed Separation Ratio", "Operating-to-Critical Speed Ratio"]
  },
  "r_1": {
    name: "Jeffcott Speed Ratio",
    symbol: "r_1",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Jeffcott Speed Ratio", "Single-Rotor Frequency Ratio"],
    symbolAliases: ["r_1"],
    aliases: ["Jeffcott Speed Ratio", "Single-Rotor Frequency Ratio"]
  },
  "e_unb": {
    name: "Rotor Mass Unbalance Eccentricity",
    symbol: "e_u",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Rotor Mass Unbalance Eccentricity", "CG Offset Eccentricity"],
    symbolAliases: ["e_u", "e"],
    aliases: ["Rotor Mass Unbalance Eccentricity", "CG Offset Eccentricity"]
  },
  "F_u": {
    name: "Centrifugal Unbalance Force",
    symbol: "F_u",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Centrifugal Unbalance Force", "Rotating Unbalance Excitation"],
    symbolAliases: ["F_u"],
    aliases: ["Centrifugal Unbalance Force", "Rotating Unbalance Excitation"]
  },
  "y_w": {
    name: "Jeffcott Steady-State Whirl Amplitude",
    symbol: "y_w",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Jeffcott Steady-State Whirl Amplitude", "Dynamic Whirling Deflection"],
    symbolAliases: ["y_w"],
    aliases: ["Jeffcott Steady-State Whirl Amplitude", "Dynamic Whirling Deflection"]
  },
  "F_dyn": {
    name: "Dynamic Whirl Shaft Force",
    symbol: "F_{dyn}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Dynamic Whirl Shaft Force", "Synchronous Dynamic Load"],
    symbolAliases: ["F_{dyn}"],
    aliases: ["Dynamic Whirl Shaft Force", "Synchronous Dynamic Load"]
  }
});
