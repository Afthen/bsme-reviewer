/**
 * src/topics/machine_design/pressure_vessels/asme_shells_and_heads/schema.js
 * Variable schema for ASME Section VIII Division 1 Shells and Formed Heads (Part V & XI).
 * References: ASME Boiler and Pressure Vessel Code Section VIII Div 1 (UG-27, UG-32, UG-34).
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { PRESSURE_VESSEL_BASE_VARS } from "../../common/pressure_vessel_base_schema.js";

export const ASME_SHELLS_AND_HEADS_VARS_DB = Object.freeze({
  "P_des": {
    name: "ASME Design Pressure",
    symbol: "P",
    dimension: DIMENSIONS.PRESSURE,
    unit: "MPa",
    nameAliases: ["ASME Design Pressure", "Design Internal Pressure", "Maximum Allowable Working Pressure"],
    symbolAliases: ["P", "P_{des}", "p"],
    aliases: ["ASME Design Pressure", "Design Internal Pressure", "Maximum Allowable Working Pressure"]
  },
  "S_allow": {
    name: "ASME Maximum Allowable Stress",
    symbol: "S",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["ASME Maximum Allowable Stress", "Maximum Allowable Material Stress", "Code Allowable Stress"],
    symbolAliases: ["S", "S_{allow}", "\\sigma_{all}"],
    aliases: ["ASME Maximum Allowable Stress", "Maximum Allowable Material Stress", "Code Allowable Stress"]
  },
  "E_w": PRESSURE_VESSEL_BASE_VARS.E_w,
  "D_i": PRESSURE_VESSEL_BASE_VARS.D_i,
  "r_i": PRESSURE_VESSEL_BASE_VARS.r_i,
  "c_a": PRESSURE_VESSEL_BASE_VARS.c_a,
  "t_cyl_h": {
    name: "Cylindrical Shell Hoop Required Thickness",
    symbol: "t_{cyl,h}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Cylindrical Shell Hoop Required Thickness", "Circumferential Shell Thickness", "UG-27 Circumferential Thickness"],
    symbolAliases: ["t_{cyl,h}", "t_c", "t_{circ}"],
    aliases: ["Cylindrical Shell Hoop Required Thickness", "Circumferential Shell Thickness", "UG-27 Circumferential Thickness"]
  },
  "t_cyl_L": {
    name: "Cylindrical Shell Longitudinal Required Thickness",
    symbol: "t_{cyl,L}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Cylindrical Shell Longitudinal Required Thickness", "UG-27 Longitudinal Thickness"],
    symbolAliases: ["t_{cyl,L}", "t_L", "t_{long}"],
    aliases: ["Cylindrical Shell Longitudinal Required Thickness", "UG-27 Longitudinal Thickness"]
  },
  "t_hemi": {
    name: "Hemispherical Head Required Thickness",
    symbol: "t_{hemi}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Hemispherical Head Required Thickness", "UG-32(f) Hemispherical Head Thickness"],
    symbolAliases: ["t_{hemi}", "t_h"],
    aliases: ["Hemispherical Head Required Thickness", "UG-32(f) Hemispherical Head Thickness"]
  },
  "t_ellip": {
    name: "2:1 Ellipsoidal Head Required Thickness",
    symbol: "t_{ellip}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["2:1 Ellipsoidal Head Required Thickness", "UG-32(d) Ellipsoidal Head Thickness"],
    symbolAliases: ["t_{ellip}", "t_e"],
    aliases: ["2:1 Ellipsoidal Head Required Thickness", "UG-32(d) Ellipsoidal Head Thickness"]
  },
  "t_tori": {
    name: "Torispherical Head Required Thickness",
    symbol: "t_{tori}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Torispherical Head Required Thickness", "UG-32(e) Torispherical Head Thickness", "Flanged and Dished Head Thickness"],
    symbolAliases: ["t_{tori}", "t_{fd}"],
    aliases: ["Torispherical Head Required Thickness", "UG-32(e) Torispherical Head Thickness", "Flanged and Dished Head Thickness"]
  },
  "L_c": {
    name: "Torispherical Dish Crown Radius",
    symbol: "L_c",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Torispherical Dish Crown Radius", "Inside Crown Radius", "Dish Radius"],
    symbolAliases: ["L_c", "L", "R_c"],
    aliases: ["Torispherical Dish Crown Radius", "Inside Crown Radius", "Dish Radius"]
  },
  "t_cone": {
    name: "Conical Head Required Thickness",
    symbol: "t_{cone}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Conical Head Required Thickness", "UG-32(g) Conical Head Thickness", "Conical Reducer Thickness"],
    symbolAliases: ["t_{cone}", "t_{con}"],
    aliases: ["Conical Head Required Thickness", "UG-32(g) Conical Head Thickness", "Conical Reducer Thickness"]
  },
  "alpha": {
    name: "Conical Section Half-Apex Angle",
    symbol: "\\alpha",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Conical Section Half-Apex Angle", "Cone Semi-Apex Angle"],
    symbolAliases: ["\\alpha", "\\theta_c"],
    aliases: ["Conical Section Half-Apex Angle", "Cone Semi-Apex Angle"]
  },
  "t_flat": {
    name: "Flat Circular Head Required Thickness",
    symbol: "t_{flat}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Flat Circular Head Required Thickness", "UG-34 Flat Cover Thickness", "Unstayed Flat Plate Thickness"],
    symbolAliases: ["t_{flat}", "t_f"],
    aliases: ["Flat Circular Head Required Thickness", "UG-34 Flat Cover Thickness", "Unstayed Flat Plate Thickness"]
  },
  "C_fac": {
    name: "Flat Head Attachment Factor",
    symbol: "C",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Flat Head Attachment Factor", "UG-34 Factor C", "Attachment Constraint Factor"],
    symbolAliases: ["C", "C_{fac}"],
    aliases: ["Flat Head Attachment Factor", "UG-34 Factor C", "Attachment Constraint Factor"]
  },
  "d_c": {
    name: "Flat Head Effective Diameter",
    symbol: "d_c",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Flat Head Effective Diameter", "Flat Cover Bolted Diameter"],
    symbolAliases: ["d_c", "d"],
    aliases: ["Flat Head Effective Diameter", "Flat Cover Bolted Diameter"]
  },
  "t_nom": PRESSURE_VESSEL_BASE_VARS.t_nom
});
