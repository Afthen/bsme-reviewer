/**
 * src/topics/machine_design/stress/transformation_mohr/relations.js
 * Relations for 2D Stress Transformation, Mohr's Circle & 3D Principal Stress States.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const TRANSFORMATION_MOHR_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_mohr_center",
    name: "Mohr's Circle Center (Average Normal Stress)",
    canonicalTex: "\\sigma_{avg} = \\frac{\\sigma_x + \\sigma_y}{2}",
    formula: "sigma_avg = (sigma_x + sigma_y) / 2"
  }),
  defineRelation({
    id: "eq_stress_mohr_halfdiff",
    name: "Mohr's Circle Half Normal Difference",
    canonicalTex: "\\Delta\\sigma_{h} = \\frac{\\sigma_x - \\sigma_y}{2}",
    formula: "sigma_diff = (sigma_x - sigma_y) / 2"
  }),
  defineRelation({
    id: "eq_stress_mohr_radius",
    name: "Mohr's Circle Radius",
    canonicalTex: "R_c = \\sqrt{\\Delta\\sigma_{h}^2 + \\tau_{xy}^2}",
    formula: "R_c = sqrt((sigma_diff^2) + (tau_xy^2))"
  }),
  defineRelation({
    id: "eq_stress_mohr_p1",
    name: "Major Principal Stress (Mohr)",
    canonicalTex: "\\sigma_1 = \\sigma_{avg} + R_c",
    formula: "sigma_1 = sigma_avg + R_c"
  }),
  defineRelation({
    id: "eq_stress_mohr_p2",
    name: "Minor Principal Stress (Mohr)",
    canonicalTex: "\\sigma_2 = \\sigma_{avg} - R_c",
    formula: "sigma_2 = sigma_avg - R_c"
  }),
  defineRelation({
    id: "eq_stress_mohr_tau_in",
    name: "Maximum In-Plane Shear Stress",
    canonicalTex: "\\tau_{max,in} = \\frac{\\sigma_1 - \\sigma_2}{2}",
    formula: "tau_max_in = (sigma_1 - sigma_2) / 2"
  }),
  defineRelation({
    id: "eq_stress_mohr_2tp",
    name: "Double Principal Orientation Angle",
    canonicalTex: "\\theta_{2p} = 2 \\theta_p",
    formula: "theta_2p = 2 * theta_p"
  }),
  defineRelation({
    id: "eq_stress_mohr_tan2tp",
    name: "Principal Plane Orientation",
    canonicalTex: "\\tan\\theta_{2p} = \\frac{\\tau_{xy}}{\\Delta\\sigma_{h}}",
    formula: "tan(theta_2p) = tau_xy / sigma_diff"
  }),
  defineRelation({
    id: "eq_stress_mohr_2ts",
    name: "Double Maximum Shear Orientation Angle",
    canonicalTex: "\\theta_{2s} = 2 \\theta_s",
    formula: "theta_2s = 2 * theta_s"
  }),
  defineRelation({
    id: "eq_stress_mohr_tan2ts",
    name: "Maximum Shear Plane Orientation",
    canonicalTex: "\\tan\\theta_{2s} = -\\frac{\\Delta\\sigma_{h}}{\\tau_{xy}}",
    formula: "tan(theta_2s) = -sigma_diff / tau_xy"
  }),
  defineRelation({
    id: "eq_stress_mohr_2theta",
    name: "Double Element Rotation Angle",
    canonicalTex: "\\theta_2 = 2 \\theta",
    formula: "theta_2 = 2 * theta"
  }),
  defineRelation({
    id: "eq_stress_mohr_sig_xp",
    name: "Normal Stress Transformation (X')",
    canonicalTex: "\\sigma_{x'} = \\sigma_{avg} + \\Delta\\sigma_{h} \\cos\\theta_2 + \\tau_{xy} \\sin\\theta_2",
    formula: "sigma_xp = sigma_avg + sigma_diff * cos(theta_2) + tau_xy * sin(theta_2)"
  }),
  defineRelation({
    id: "eq_stress_mohr_sig_yp",
    name: "Normal Stress Transformation (Y')",
    canonicalTex: "\\sigma_{y'} = \\sigma_{avg} - \\Delta\\sigma_{h} \\cos\\theta_2 - \\tau_{xy} \\sin\\theta_2",
    formula: "sigma_yp = sigma_avg - sigma_diff * cos(theta_2) - tau_xy * sin(theta_2)"
  }),
  defineRelation({
    id: "eq_stress_mohr_tau_xyp",
    name: "Shear Stress Transformation (X'Y')",
    canonicalTex: "\\tau_{x'y'} = -\\Delta\\sigma_{h} \\sin\\theta_2 + \\tau_{xy} \\cos\\theta_2",
    formula: "tau_xyp = -sigma_diff * sin(theta_2) + tau_xy * cos(theta_2)"
  }),
  defineRelation({
    id: "eq_stress_mohr_tau13",
    name: "Maximum Absolute Shear Stress (3D)",
    canonicalTex: "\\tau_{abs,max} = \\frac{\\sigma_1 - \\sigma_3}{2}",
    formula: "tau_13 = (sigma_1 - sigma_3) / 2"
  }),
  defineRelation({
    id: "eq_stress_mohr_tau23",
    name: "Principal Shear Stress (2-3 Plane)",
    canonicalTex: "\\tau_{23} = \\frac{\\sigma_2 - \\sigma_3}{2}",
    formula: "tau_23 = (sigma_2 - sigma_3) / 2"
  }),
  defineRelation({
    id: "eq_stress_mohr_mean3d",
    name: "3D Hydrostatic Mean Normal Stress",
    canonicalTex: "\\sigma_{m,3D} = \\frac{\\sigma_1 + \\sigma_2 + \\sigma_3}{3}",
    formula: "sigma_m3d = (sigma_1 + sigma_2 + sigma_3) / 3"
  }),
  defineRelation({
    id: "eq_stress_mohr_vm3d",
    name: "3D von Mises Equivalent Stress",
    canonicalTex: "\\sigma'_{3D} = \\sqrt{\\frac{(\\sigma_1 - \\sigma_2)^2 + (\\sigma_2 - \\sigma_3)^2 + (\\sigma_3 - \\sigma_1)^2}{2}}",
    formula: "sigma_vm3d = sqrt((((sigma_1 - sigma_2)^2) + ((sigma_2 - sigma_3)^2) + ((sigma_3 - sigma_1)^2)) / 2)"
  }),
  defineRelation({
    id: "eq_stress_mohr_hooke3d",
    name: "Generalized 3D Hooke's Law (Major Principal Strain)",
    canonicalTex: "\\varepsilon_1 = \\frac{\\sigma_1 - \\nu(\\sigma_2 + \\sigma_3)}{E}",
    formula: "eps_1 = (sigma_1 - nu * (sigma_2 + sigma_3)) / E"
  })
]);
