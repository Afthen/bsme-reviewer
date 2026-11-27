/**
 * src/topics/machine_design/pressure_vessels/asme_shells_and_heads/relations.js
 * ASME Section VIII Division 1 formulas for Cylindrical Shells and Formed Heads.
 * Citations: ASME Sec VIII Div 1 (2021/2023), UG-27(c)(1-2), UG-32(d-g), UG-34.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const ASME_SHELLS_AND_HEADS_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_pv_asme_di_ri",
    name: "Shell Diameter and Radius",
    canonicalTex: "D_i = 2 r_i",
    formula: "D_i = 2 * r_i"
  }),
  defineRelation({
    id: "eq_pv_asme_lc_di",
    name: "Torispherical Standard Crown Radius",
    canonicalTex: "L_c = D_i",
    formula: "L_c = D_i"
  }),
  defineRelation({
    id: "eq_pv_asme_dc_di",
    name: "Flat Cover Diameter Sizing",
    canonicalTex: "d_c = D_i",
    formula: "d_c = D_i"
  }),
  defineRelation({
    id: "eq_pv_asme_tnom",
    name: "Nominal Plate Thickness with Corrosion Allowance",
    canonicalTex: "t_{nom} = t_{cyl,h} + c_a",
    formula: "t_nom = t_cyl_h + c_a"
  }),
  defineRelation({
    id: "eq_pv_asme_cyl_hoop",
    name: "ASME UG-27(c)(1) Cylindrical Shell Circumferential Thickness",
    canonicalTex: "t_{cyl,h} = \\frac{P r_i}{S E_w - 0.6 P}",
    formula: "t_cyl_h = (P_des * r_i) / (S_allow * E_w - 0.6 * P_des)"
  }),
  defineRelation({
    id: "eq_pv_asme_cyl_long",
    name: "ASME UG-27(c)(2) Cylindrical Shell Longitudinal Thickness",
    canonicalTex: "t_{cyl,L} = \\frac{P r_i}{2 S E_w + 0.4 P}",
    formula: "t_cyl_L = (P_des * r_i) / (2 * S_allow * E_w + 0.4 * P_des)"
  }),
  defineRelation({
    id: "eq_pv_asme_hemi",
    name: "ASME UG-32(f) Hemispherical Head Thickness",
    canonicalTex: "t_{hemi} = \\frac{P r_i}{2 S E_w - 0.2 P}",
    formula: "t_hemi = (P_des * r_i) / (2 * S_allow * E_w - 0.2 * P_des)"
  }),
  defineRelation({
    id: "eq_pv_asme_ellip",
    name: "ASME UG-32(d) 2:1 Ellipsoidal Head Thickness",
    canonicalTex: "t_{ellip} = \\frac{P D_i}{2 S E_w - 0.2 P}",
    formula: "t_ellip = (P_des * D_i) / (2 * S_allow * E_w - 0.2 * P_des)"
  }),
  defineRelation({
    id: "eq_pv_asme_tori",
    name: "ASME UG-32(e) Standard Torispherical Head Thickness",
    canonicalTex: "t_{tori} = \\frac{0.885 P L_c}{S E_w - 0.1 P}",
    formula: "t_tori = (0.885 * P_des * L_c) / (S_allow * E_w - 0.1 * P_des)"
  }),
  defineRelation({
    id: "eq_pv_asme_cone",
    name: "ASME UG-32(g) Conical Head Thickness",
    canonicalTex: "t_{cone} = \\frac{P D_i}{2 \\cos(\\alpha) (S E_w - 0.6 P)}",
    formula: "t_cone = (P_des * D_i) / (2 * cos(alpha) * (S_allow * E_w - 0.6 * P_des))"
  }),
  defineRelation({
    id: "eq_pv_asme_flat",
    name: "ASME UG-34 Flat Circular Cover Plate Thickness",
    canonicalTex: "t_{flat} = d_c \\sqrt{\\frac{C P}{S E_w}}",
    formula: "t_flat = d_c * sqrt((C_fac * P_des) / (S_allow * E_w))"
  })
]);
