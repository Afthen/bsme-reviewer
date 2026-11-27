/**
 * src/topics/machine_design/stress/torsion/schema.js
 * Schema for Elastic Torsion of Solid & Hollow Circular Members (Part V, Sec. 10).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const TORSION_VARS_DB = Object.freeze({
  "P": {
    name: "Transmitted Mechanical Power",
    symbol: "P",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    nameAliases: ["Transmitted Mechanical Power", "Shaft Power"],
    symbolAliases: ["P", "H"],
    aliases: ["Transmitted Mechanical Power", "Shaft Power"]
  },
  "T_0": {
    name: "Applied Junction Torque",
    symbol: "T_0",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Applied Junction Torque", "Total Applied Torque"],
    symbolAliases: ["T_0", "T"],
    aliases: ["Applied Junction Torque", "Total Applied Torque"]
  },
  "n": {
    name: "Rotational Speed",
    symbol: "n",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    nameAliases: ["Rotational Speed", "Shaft Speed"],
    symbolAliases: ["n", "N"],
    aliases: ["Rotational Speed", "Shaft Speed"]
  },
  "omega": {
    name: "Angular Velocity",
    symbol: "\\omega",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rad/s",
    nameAliases: ["Angular Velocity", "Rotational Angular Speed"],
    symbolAliases: ["\\omega"],
    aliases: ["Angular Velocity", "Rotational Angular Speed"]
  },
  "d_1": {
    name: "Solid Segment Diameter",
    symbol: "d_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Solid Segment Diameter", "Solid Circular Diameter"],
    symbolAliases: ["d_1", "d"],
    aliases: ["Solid Segment Diameter", "Solid Circular Diameter"]
  },
  "r_1": {
    name: "Solid Segment Outer Radius",
    symbol: "r_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Solid Segment Outer Radius", "Solid Section Radius"],
    symbolAliases: ["r_1", "c_1"],
    aliases: ["Solid Segment Outer Radius", "Solid Section Radius"]
  },
  "L_1": {
    name: "Solid Segment Length",
    symbol: "L_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Solid Segment Length", "Section 1 Length"],
    symbolAliases: ["L_1"],
    aliases: ["Solid Segment Length", "Section 1 Length"]
  },
  "G_1": {
    name: "Solid Segment Shear Modulus",
    symbol: "G_1",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Solid Segment Shear Modulus", "Section 1 Modulus of Rigidity"],
    symbolAliases: ["G_1"],
    aliases: ["Solid Segment Shear Modulus", "Section 1 Modulus of Rigidity"]
  },
  "J_1": {
    name: "Solid Segment Polar Moment of Inertia",
    symbol: "J_1",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Solid Segment Polar Moment of Inertia", "Solid Polar Inertia"],
    symbolAliases: ["J_1"],
    aliases: ["Solid Segment Polar Moment of Inertia", "Solid Polar Inertia"]
  },
  "Z_p1": {
    name: "Solid Polar Section Modulus",
    symbol: "Z_{p1}",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Solid Polar Section Modulus", "Section 1 Polar Modulus"],
    symbolAliases: ["Z_{p1}", "J_1/c_1"],
    aliases: ["Solid Polar Section Modulus", "Section 1 Polar Modulus"]
  },
  "k_t1": {
    name: "Solid Segment Torsional Stiffness",
    symbol: "k_{t1}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Solid Segment Torsional Stiffness", "Section 1 Torsional Rate"],
    symbolAliases: ["k_{t1}"],
    aliases: ["Solid Segment Torsional Stiffness", "Section 1 Torsional Rate"]
  },
  "T_1": {
    name: "Solid Segment Torque",
    symbol: "T_1",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Solid Segment Torque", "Left Support Torque Reaction"],
    symbolAliases: ["T_1"],
    aliases: ["Solid Segment Torque", "Left Support Torque Reaction"]
  },
  "tau_1": {
    name: "Solid Segment Torsional Shear Stress",
    symbol: "\\tau_1",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Solid Segment Torsional Shear Stress", "Section 1 Maximum Shear Stress"],
    symbolAliases: ["\\tau_1"],
    aliases: ["Solid Segment Torsional Shear Stress", "Section 1 Maximum Shear Stress"]
  },
  "D_o": {
    name: "Hollow Segment Outer Diameter",
    symbol: "D_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Segment Outer Diameter", "Tube Outside Diameter"],
    symbolAliases: ["D_o"],
    aliases: ["Hollow Segment Outer Diameter", "Tube Outside Diameter"]
  },
  "D_i": {
    name: "Hollow Segment Inner Diameter",
    symbol: "D_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Segment Inner Diameter", "Tube Inside Bore Diameter"],
    symbolAliases: ["D_i"],
    aliases: ["Hollow Segment Inner Diameter", "Tube Inside Bore Diameter"]
  },
  "r_o": {
    name: "Hollow Segment Outer Radius",
    symbol: "r_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Segment Outer Radius", "Tube Outer Radius"],
    symbolAliases: ["r_o", "c_2"],
    aliases: ["Hollow Segment Outer Radius", "Tube Outer Radius"]
  },
  "k_d": {
    name: "Hollow Diameter Ratio",
    symbol: "k_d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Hollow Diameter Ratio", "Bore-to-Outer Diameter Ratio"],
    symbolAliases: ["k_d", "C_d"],
    aliases: ["Hollow Diameter Ratio", "Bore-to-Outer Diameter Ratio"]
  },
  "L_2": {
    name: "Hollow Segment Length",
    symbol: "L_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hollow Segment Length", "Section 2 Length"],
    symbolAliases: ["L_2"],
    aliases: ["Hollow Segment Length", "Section 2 Length"]
  },
  "G_2": {
    name: "Hollow Segment Shear Modulus",
    symbol: "G_2",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Hollow Segment Shear Modulus", "Section 2 Modulus of Rigidity"],
    symbolAliases: ["G_2"],
    aliases: ["Hollow Segment Shear Modulus", "Section 2 Modulus of Rigidity"]
  },
  "J_2": {
    name: "Hollow Segment Polar Moment of Inertia",
    symbol: "J_2",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Hollow Segment Polar Moment of Inertia", "Hollow Polar Inertia"],
    symbolAliases: ["J_2"],
    aliases: ["Hollow Segment Polar Moment of Inertia", "Hollow Polar Inertia"]
  },
  "Z_p2": {
    name: "Hollow Polar Section Modulus",
    symbol: "Z_{p2}",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Hollow Polar Section Modulus", "Section 2 Polar Modulus"],
    symbolAliases: ["Z_{p2}"],
    aliases: ["Hollow Polar Section Modulus", "Section 2 Polar Modulus"]
  },
  "k_t2": {
    name: "Hollow Segment Torsional Stiffness",
    symbol: "k_{t2}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Hollow Segment Torsional Stiffness", "Section 2 Torsional Rate"],
    symbolAliases: ["k_{t2}"],
    aliases: ["Hollow Segment Torsional Stiffness", "Section 2 Torsional Rate"]
  },
  "T_2": {
    name: "Hollow Segment Torque",
    symbol: "T_2",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Hollow Segment Torque", "Right Support Torque Reaction"],
    symbolAliases: ["T_2"],
    aliases: ["Hollow Segment Torque", "Right Support Torque Reaction"]
  },
  "tau_2": {
    name: "Hollow Segment Torsional Shear Stress",
    symbol: "\\tau_2",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Hollow Segment Torsional Shear Stress", "Section 2 Maximum Shear Stress"],
    symbolAliases: ["\\tau_2"],
    aliases: ["Hollow Segment Torsional Shear Stress", "Section 2 Maximum Shear Stress"]
  },
  "k_teq": {
    name: "Fixed-End Equivalent Torsional Stiffness",
    symbol: "k_{t,eq}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Fixed-End Equivalent Torsional Stiffness", "Parallel Torsional Stiffness"],
    symbolAliases: ["k_{t,eq}"],
    aliases: ["Fixed-End Equivalent Torsional Stiffness", "Parallel Torsional Stiffness"]
  },
  "theta": {
    name: "Junction Angle of Twist",
    symbol: "\\theta",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Junction Angle of Twist", "Fixed-End Elastic Twist Angle"],
    symbolAliases: ["\\theta", "\\phi"],
    aliases: ["Junction Angle of Twist", "Fixed-End Elastic Twist Angle"]
  },
  "k_tser": {
    name: "Unrestrained Series Torsional Stiffness",
    symbol: "k_{t,ser}",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Unrestrained Series Torsional Stiffness", "Series Torsional Stiffness"],
    symbolAliases: ["k_{t,ser}"],
    aliases: ["Unrestrained Series Torsional Stiffness", "Series Torsional Stiffness"]
  },
  "theta_ser": {
    name: "Total Series Angle of Twist",
    symbol: "\\theta_{ser}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Total Series Angle of Twist", "Unrestrained Total Twist Angle"],
    symbolAliases: ["\\theta_{ser}"],
    aliases: ["Total Series Angle of Twist", "Unrestrained Total Twist Angle"]
  },
  "S_sy": {
    name: "Material Shear Yield Strength",
    symbol: "S_{sy}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Material Shear Yield Strength", "Torsional Yield Strength"],
    symbolAliases: ["S_{sy}", "\\tau_y"],
    aliases: ["Material Shear Yield Strength", "Torsional Yield Strength"]
  },
  "n_t1": {
    name: "Torsional Factor of Safety",
    symbol: "n_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Torsional Factor of Safety", "Shaft Shear Safety Factor"],
    symbolAliases: ["n_t"],
    aliases: ["Torsional Factor of Safety", "Shaft Shear Safety Factor"]
  }
});
