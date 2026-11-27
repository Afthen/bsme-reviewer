/**
 * src/topics/machine_design/stress/transformation_mohr/schema.js
 * Schema for Plane Stress Transformation, Mohr's Circle & 3D Principal Stress States (Part VII, Sec. 12-14).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const TRANSFORMATION_MOHR_VARS_DB = Object.freeze({
  sigma_1: STRESS_BASE_VARS.sigma_1,
  sigma_2: STRESS_BASE_VARS.sigma_2,
  E: STRESS_BASE_VARS.E,
  nu: STRESS_BASE_VARS.nu,

  "sigma_x": {
    name: "Normal Stress in X-Direction",
    symbol: "\\sigma_x",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Normal Stress in X-Direction", "Horizontal Normal Stress"],
    symbolAliases: ["\\sigma_x"],
    aliases: ["Normal Stress in X-Direction", "Horizontal Normal Stress"]
  },
  "sigma_y": {
    name: "Normal Stress in Y-Direction",
    symbol: "\\sigma_y",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Normal Stress in Y-Direction", "Vertical Normal Stress"],
    symbolAliases: ["\\sigma_y"],
    aliases: ["Normal Stress in Y-Direction", "Vertical Normal Stress"]
  },
  "tau_xy": {
    name: "In-Plane Shear Stress",
    symbol: "\\tau_{xy}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["In-Plane Shear Stress", "Element XY Shear Stress"],
    symbolAliases: ["\\tau_{xy}"],
    aliases: ["In-Plane Shear Stress", "Element XY Shear Stress"]
  },
  "sigma_avg": {
    name: "Mohr's Circle Center Stress",
    symbol: "\\sigma_{avg}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Mohr's Circle Center Stress", "Average In-Plane Normal Stress"],
    symbolAliases: ["\\sigma_{avg}", "C"],
    aliases: ["Mohr's Circle Center Stress", "Average In-Plane Normal Stress"]
  },
  "sigma_diff": {
    name: "Half Normal Stress Difference",
    symbol: "\\Delta\\sigma_{h}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Half Normal Stress Difference", "Mohr's Circle Horizontal Leg"],
    symbolAliases: ["\\Delta\\sigma_{h}"],
    aliases: ["Half Normal Stress Difference", "Mohr's Circle Horizontal Leg"]
  },
  "R_c": {
    name: "Mohr's Circle Radius",
    symbol: "R_c",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Mohr's Circle Radius", "Circle Radius Stress"],
    symbolAliases: ["R_c", "R"],
    aliases: ["Mohr's Circle Radius", "Circle Radius Stress"]
  },
  "tau_max_in": {
    name: "Maximum In-Plane Shear Stress",
    symbol: "\\tau_{max,in}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum In-Plane Shear Stress", "In-Plane Peak Shear"],
    symbolAliases: ["\\tau_{max,in}"],
    aliases: ["Maximum In-Plane Shear Stress", "In-Plane Peak Shear"]
  },
  "theta_p": {
    name: "Principal Plane Orientation Angle",
    symbol: "\\theta_p",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Principal Plane Orientation Angle", "Principal Axis Angle"],
    symbolAliases: ["\\theta_p"],
    aliases: ["Principal Plane Orientation Angle", "Principal Axis Angle"]
  },
  "theta_2p": {
    name: "Mohr Double Principal Angle",
    symbol: "\\theta_{2p}",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Mohr Double Principal Angle", "Twice Principal Orientation Angle"],
    symbolAliases: ["\\theta_{2p}", "2\\theta_p"],
    aliases: ["Mohr Double Principal Angle", "Twice Principal Orientation Angle"]
  },
  "theta_s": {
    name: "Maximum Shear Plane Angle",
    symbol: "\\theta_s",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Maximum Shear Plane Angle", "Shear Plane Orientation"],
    symbolAliases: ["\\theta_s"],
    aliases: ["Maximum Shear Plane Angle", "Shear Plane Orientation"]
  },
  "theta_2s": {
    name: "Mohr Double Shear Angle",
    symbol: "\\theta_{2s}",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Mohr Double Shear Angle", "Twice Max-Shear Orientation Angle"],
    symbolAliases: ["\\theta_{2s}", "2\\theta_s"],
    aliases: ["Mohr Double Shear Angle", "Twice Max-Shear Orientation Angle"]
  },
  "theta": {
    name: "Element Rotation Angle",
    symbol: "\\theta",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Element Rotation Angle", "Inclined Plane Angle"],
    symbolAliases: ["\\theta"],
    aliases: ["Element Rotation Angle", "Inclined Plane Angle"]
  },
  "theta_2": {
    name: "Mohr Double Rotation Angle",
    symbol: "\\theta_2",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Mohr Double Rotation Angle", "Twice Element Rotation Angle"],
    symbolAliases: ["\\theta_2", "2\\theta"],
    aliases: ["Mohr Double Rotation Angle", "Twice Element Rotation Angle"]
  },
  "sigma_xp": {
    name: "Transformed X' Normal Stress",
    symbol: "\\sigma_{x'}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Transformed X' Normal Stress", "Inclined Plane Normal Stress"],
    symbolAliases: ["\\sigma_{x'}"],
    aliases: ["Transformed X' Normal Stress", "Inclined Plane Normal Stress"]
  },
  "sigma_yp": {
    name: "Transformed Y' Normal Stress",
    symbol: "\\sigma_{y'}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Transformed Y' Normal Stress", "Orthogonal Inclined Normal Stress"],
    symbolAliases: ["\\sigma_{y'}"],
    aliases: ["Transformed Y' Normal Stress", "Orthogonal Inclined Normal Stress"]
  },
  "tau_xyp": {
    name: "Transformed X'Y' Shear Stress",
    symbol: "\\tau_{x'y'}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Transformed X'Y' Shear Stress", "Inclined Plane Shear Stress"],
    symbolAliases: ["\\tau_{x'y'}"],
    aliases: ["Transformed X'Y' Shear Stress", "Inclined Plane Shear Stress"]
  },
  "sigma_3": {
    name: "Third Principal Stress",
    symbol: "\\sigma_3",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Third Principal Stress", "Out-of-Plane Principal Stress"],
    symbolAliases: ["\\sigma_3", "\\sigma_z"],
    aliases: ["Third Principal Stress", "Out-of-Plane Principal Stress"]
  },
  "tau_13": {
    name: "Maximum Absolute Shear Stress (3D)",
    symbol: "\\tau_{abs,max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Absolute Shear Stress (3D)", "3D Extreme Shear Stress"],
    symbolAliases: ["\\tau_{abs,max}", "\\tau_{13}"],
    aliases: ["Maximum Absolute Shear Stress (3D)", "3D Extreme Shear Stress"]
  },
  "tau_23": {
    name: "Secondary Principal Shear Stress (2-3)",
    symbol: "\\tau_{23}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Secondary Principal Shear Stress (2-3)", "Out-of-Plane 2-3 Shear"],
    symbolAliases: ["\\tau_{23}"],
    aliases: ["Secondary Principal Shear Stress (2-3)", "Out-of-Plane 2-3 Shear"]
  },
  "sigma_m3d": {
    name: "Hydrostatic Mean Normal Stress (3D)",
    symbol: "\\sigma_{m,3D}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Hydrostatic Mean Normal Stress (3D)", "3D Octahedral Normal Stress"],
    symbolAliases: ["\\sigma_{m,3D}", "\\sigma_{oct}"],
    aliases: ["Hydrostatic Mean Normal Stress (3D)", "3D Octahedral Normal Stress"]
  },
  "sigma_vm3d": {
    name: "3D von Mises Equivalent Stress",
    symbol: "\\sigma'_{3D}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["3D von Mises Equivalent Stress", "Triaxial Distortion Stress"],
    symbolAliases: ["\\sigma'_{3D}"],
    aliases: ["3D von Mises Equivalent Stress", "Triaxial Distortion Stress"]
  },
  "eps_1": {
    name: "Major Principal Strain (3D Hooke)",
    symbol: "\\varepsilon_1",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Major Principal Strain (3D Hooke)", "First Principal Strain"],
    symbolAliases: ["\\varepsilon_1"],
    aliases: ["Major Principal Strain (3D Hooke)", "First Principal Strain"]
  }
});
