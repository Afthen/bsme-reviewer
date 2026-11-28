/**
 * src/topics/machine_design/shafting/rigidity_torsion/schema.js
 * Schema for Stepped-Shaft Torsional Rigidity, Equivalent Diameter & Torsional Sizing.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_RIGIDITY_TORSION_VARS_DB = Object.freeze({
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "P": SHAFT_BASE_VARS.P,
  "T": SHAFT_BASE_VARS.T,
  "G": SHAFT_BASE_VARS.G,
  "L_1": {
    name: "Segment 1 Length",
    symbol: "L_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 1 Length", "First Step Length"],
    symbolAliases: ["L_1"],
    aliases: ["Segment 1 Length", "First Step Length"]
  },
  "L_2": {
    name: "Segment 2 Length",
    symbol: "L_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 2 Length", "Second Step Length"],
    symbolAliases: ["L_2"],
    aliases: ["Segment 2 Length", "Second Step Length"]
  },
  "L_3": {
    name: "Segment 3 Length",
    symbol: "L_3",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 3 Length", "Third Step Length"],
    symbolAliases: ["L_3"],
    aliases: ["Segment 3 Length", "Third Step Length"]
  },
  "L_tot": {
    name: "Total Shaft Length",
    symbol: "L_{tot}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Shaft Length", "Overall Stepped Length"],
    symbolAliases: ["L_{tot}", "L"],
    aliases: ["Total Shaft Length", "Overall Stepped Length"]
  },
  "d_1": {
    name: "Segment 1 Diameter",
    symbol: "d_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 1 Diameter", "First Step Diameter"],
    symbolAliases: ["d_1"],
    aliases: ["Segment 1 Diameter", "First Step Diameter"]
  },
  "d_2": {
    name: "Segment 2 Diameter",
    symbol: "d_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 2 Diameter", "Second Step Diameter"],
    symbolAliases: ["d_2"],
    aliases: ["Segment 2 Diameter", "Second Step Diameter"]
  },
  "d_3": {
    name: "Segment 3 Diameter",
    symbol: "d_3",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 3 Diameter", "Third Step Diameter"],
    symbolAliases: ["d_3"],
    aliases: ["Segment 3 Diameter", "Third Step Diameter"]
  },
  "J_1": {
    name: "Segment 1 Polar Inertia",
    symbol: "J_1",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Segment 1 Polar Inertia", "First Step Polar Moment"],
    symbolAliases: ["J_1"],
    aliases: ["Segment 1 Polar Inertia", "First Step Polar Moment"]
  },
  "J_2": {
    name: "Segment 2 Polar Inertia",
    symbol: "J_2",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Segment 2 Polar Inertia", "Second Step Polar Moment"],
    symbolAliases: ["J_2"],
    aliases: ["Segment 2 Polar Inertia", "Second Step Polar Moment"]
  },
  "J_3": {
    name: "Segment 3 Polar Inertia",
    symbol: "J_3",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Segment 3 Polar Inertia", "Third Step Polar Moment"],
    symbolAliases: ["J_3"],
    aliases: ["Segment 3 Polar Inertia", "Third Step Polar Moment"]
  },
  "theta_1": {
    name: "Segment 1 Angle of Twist",
    symbol: "\\theta_1",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Segment 1 Angle of Twist", "First Step Twist"],
    symbolAliases: ["\\theta_1"],
    aliases: ["Segment 1 Angle of Twist", "First Step Twist"]
  },
  "theta_2": {
    name: "Segment 2 Angle of Twist",
    symbol: "\\theta_2",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Segment 2 Angle of Twist", "Second Step Twist"],
    symbolAliases: ["\\theta_2"],
    aliases: ["Segment 2 Angle of Twist", "Second Step Twist"]
  },
  "theta_3": {
    name: "Segment 3 Angle of Twist",
    symbol: "\\theta_3",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Segment 3 Angle of Twist", "Third Step Twist"],
    symbolAliases: ["\\theta_3"],
    aliases: ["Segment 3 Angle of Twist", "Third Step Twist"]
  },
  "theta_tot": {
    name: "Total Stepped Angle of Twist",
    symbol: "\\theta_{tot}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Total Stepped Angle of Twist", "Cumulative Twist Angle"],
    symbolAliases: ["\\theta_{tot}", "\\theta"],
    aliases: ["Total Stepped Angle of Twist", "Cumulative Twist Angle"]
  },
  "k_t": {
    name: "Overall Torsional Stiffness",
    symbol: "k_t",
    dimension: DIMENSIONS.TORSIONAL_STIFFNESS,
    unit: "N-m/rad",
    nameAliases: ["Overall Torsional Stiffness", "Equivalent Shaft Torsional Rate"],
    symbolAliases: ["k_t"],
    aliases: ["Overall Torsional Stiffness", "Equivalent Shaft Torsional Rate"]
  },
  "J_eq": {
    name: "Equivalent Uniform Polar Inertia",
    symbol: "J_{eq}",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Equivalent Uniform Polar Inertia", "Effective Uniform Polar Moment"],
    symbolAliases: ["J_{eq}"],
    aliases: ["Equivalent Uniform Polar Inertia", "Effective Uniform Polar Moment"]
  },
  "d_eq": {
    name: "Equivalent Uniform Shaft Diameter",
    symbol: "d_{eq}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Equivalent Uniform Shaft Diameter", "Torsionally Equivalent Diameter"],
    symbolAliases: ["d_{eq}"],
    aliases: ["Equivalent Uniform Shaft Diameter", "Torsionally Equivalent Diameter"]
  },
  "theta_allow": {
    name: "Allowable Total Twist Angle",
    symbol: "\\theta_{allow}",
    dimension: DIMENSIONS.ANGLE,
    unit: "rad",
    nameAliases: ["Allowable Total Twist Angle", "Permissible Shaft Twist"],
    symbolAliases: ["\\theta_{allow}"],
    aliases: ["Allowable Total Twist Angle", "Permissible Shaft Twist"]
  },
  "J_rig": {
    name: "Twist-Required Polar Inertia",
    symbol: "J_{rig}",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Twist-Required Polar Inertia", "Torsional Rigidity Inertia"],
    symbolAliases: ["J_{rig}"],
    aliases: ["Twist-Required Polar Inertia", "Torsional Rigidity Inertia"]
  },
  "d_rig_T": {
    name: "Torsional Rigidity Shaft Diameter",
    symbol: "d_{rig,T}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Torsional Rigidity Shaft Diameter", "Twist-Governed Diameter"],
    symbolAliases: ["d_{rig,T}"],
    aliases: ["Torsional Rigidity Shaft Diameter", "Twist-Governed Diameter"]
  },
  "tau_allow": {
    name: "Allowable Torsional Shear Stress",
    symbol: "\\tau_{allow}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Allowable Torsional Shear Stress", "Permissible Shear Stress"],
    symbolAliases: ["\\tau_{allow}"],
    aliases: ["Allowable Torsional Shear Stress", "Permissible Shear Stress"]
  },
  "Z_p_str": {
    name: "Torsional Strength Section Modulus",
    symbol: "Z_{p,str}",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Torsional Strength Section Modulus", "Polar Modulus Demand"],
    symbolAliases: ["Z_{p,str}"],
    aliases: ["Torsional Strength Section Modulus", "Polar Modulus Demand"]
  },
  "d_str_T": {
    name: "Torsional Strength Shaft Diameter",
    symbol: "d_{str,T}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Torsional Strength Shaft Diameter", "Shear-Governed Diameter"],
    symbolAliases: ["d_{str,T}"],
    aliases: ["Torsional Strength Shaft Diameter", "Shear-Governed Diameter"]
  },
  "n_theta": {
    name: "Torsional Rigidity Factor",
    symbol: "n_{\\theta}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Torsional Rigidity Factor", "Twist Safety Margin"],
    symbolAliases: ["n_{\\theta}"],
    aliases: ["Torsional Rigidity Factor", "Twist Safety Margin"]
  }
});
