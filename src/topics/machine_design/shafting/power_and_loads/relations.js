/**
 * src/topics/machine_design/shafting/power_and_loads/relations.js
 * 3D shaft power transmission, helical/spur gear loads, belt pulley loads,
 * bearing reactions, and horizontal/vertical/resultant bending moments.
 * Reference: Shigley's Mechanical Engineering Design, Ch. 3 & Ch. 7; Mott, Ch. 12.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_SHAFT_OMEGA } from "../../common/shaft_base_relations.js";

export const SHAFT_POWER_LOADS_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,

  defineRelation({
    id: "eq_shaft_pl_p_out",
    name: "Mechanical Power Output",
    canonicalTex: "P_{out} = \\eta_m P_{in}",
    formula: "P_out = eta_m * P_in"
  }),
  defineRelation({
    id: "eq_shaft_pl_p_loss",
    name: "Transmission Power Loss",
    canonicalTex: "\\Delta P = P_{in} - P_{out}",
    formula: "P_loss = P_in - P_out"
  }),
  defineRelation({
    id: "eq_shaft_pl_p_des",
    name: "Design Power with Service Factor",
    canonicalTex: "P_{des} = K_s P_{in}",
    formula: "P_des = K_s * P_in"
  }),
  defineRelation({
    id: "eq_shaft_pl_torque",
    name: "Design Shaft Torque",
    canonicalTex: "P_{des} = T\\omega",
    formula: "P_des = T * omega"
  }),
  defineRelation({
    id: "eq_shaft_pl_wt",
    name: "Gear Tangential Load from Torque",
    canonicalTex: "W_t = \\frac{2 T}{D_g}",
    formula: "W_t = (2 * T) / D_g"
  }),
  defineRelation({
    id: "eq_shaft_pl_wr",
    name: "Gear Radial Separating Force",
    canonicalTex: "W_r = W_t \\tan\\phi",
    formula: "W_r = W_t * tan(phi_g)"
  }),
  defineRelation({
    id: "eq_shaft_pl_fax",
    name: "Helical Gear Axial Thrust",
    canonicalTex: "F_{ax} = W_t \\tan\\psi",
    formula: "F_ax = W_t * tan(psi_g)"
  }),
  defineRelation({
    id: "eq_shaft_pl_belt_t",
    name: "Belt Drive Torque Equilibrium",
    canonicalTex: "T = \\frac{(F_1 - F_2) D_p}{2}",
    formula: "T = ((F_1 - F_2) * D_p) / 2"
  }),
  defineRelation({
    id: "eq_shaft_pl_belt_ratio",
    name: "Belt Tension Ratio",
    canonicalTex: "k_b = \\frac{F_1}{F_2}",
    formula: "k_b_tens = F_1 / F_2"
  }),
  defineRelation({
    id: "eq_shaft_pl_belt_pull",
    name: "Resultant Belt Pulley Pull",
    canonicalTex: "F_b = F_1 + F_2",
    formula: "F_b = F_1 + F_2"
  }),
  defineRelation({
    id: "eq_shaft_pl_span1",
    name: "Bearing Span at Gear Section",
    canonicalTex: "L = a_1 + b_1",
    formula: "L = a_1 + b_1"
  }),
  defineRelation({
    id: "eq_shaft_pl_span2",
    name: "Bearing Span at Pulley Section",
    canonicalTex: "L = a_2 + b_2",
    formula: "L = a_2 + b_2"
  }),
  defineRelation({
    id: "eq_shaft_pl_rav",
    name: "Bearing A Vertical Reaction",
    canonicalTex: "R_{Av} = \\frac{W_t b_1}{L}",
    formula: "R_Av = (W_t * b_1) / L"
  }),
  defineRelation({
    id: "eq_shaft_pl_rbv",
    name: "Bearing B Vertical Reaction",
    canonicalTex: "R_{Bv} = \\frac{W_t a_1}{L}",
    formula: "R_Bv = (W_t * a_1) / L"
  }),
  defineRelation({
    id: "eq_shaft_pl_rah",
    name: "Bearing A Horizontal Reaction",
    canonicalTex: "R_{Ah} = \\frac{W_r b_1 + F_b b_2}{L}",
    formula: "R_Ah = (W_r * b_1 + F_b * b_2) / L"
  }),
  defineRelation({
    id: "eq_shaft_pl_rbh",
    name: "Bearing B Horizontal Reaction",
    canonicalTex: "R_{Bh} = \\frac{W_r a_1 + F_b a_2}{L}",
    formula: "R_Bh = (W_r * a_1 + F_b * a_2) / L"
  }),
  defineRelation({
    id: "eq_shaft_pl_ra",
    name: "Bearing A Resultant Radial Load",
    canonicalTex: "R_A = \\sqrt{R_{Av}^2 + R_{Ah}^2}",
    formula: "R_A = sqrt((R_Av^2) + (R_Ah^2))"
  }),
  defineRelation({
    id: "eq_shaft_pl_rb",
    name: "Bearing B Resultant Radial Load",
    canonicalTex: "R_B = \\sqrt{R_{Bv}^2 + R_{Bh}^2}",
    formula: "R_B = sqrt((R_Bv^2) + (R_Bh^2))"
  }),
  defineRelation({
    id: "eq_shaft_pl_mv1",
    name: "Vertical Bending Moment at Gear",
    canonicalTex: "M_{v1} = R_{Av} a_1",
    formula: "M_v1 = R_Av * a_1"
  }),
  defineRelation({
    id: "eq_shaft_pl_mh1",
    name: "Horizontal Bending Moment at Gear",
    canonicalTex: "M_{h1} = R_{Ah} a_1",
    formula: "M_h1 = R_Ah * a_1"
  }),
  defineRelation({
    id: "eq_shaft_pl_m1",
    name: "Resultant Bending Moment at Gear",
    canonicalTex: "M_1 = \\sqrt{M_{v1}^2 + M_{h1}^2}",
    formula: "M_1 = sqrt((M_v1^2) + (M_h1^2))"
  }),
  defineRelation({
    id: "eq_shaft_pl_mv2",
    name: "Vertical Bending Moment at Pulley",
    canonicalTex: "M_{v2} = R_{Bv} b_2",
    formula: "M_v2 = R_Bv * b_2"
  }),
  defineRelation({
    id: "eq_shaft_pl_mh2",
    name: "Horizontal Bending Moment at Pulley",
    canonicalTex: "M_{h2} = R_{Bh} b_2",
    formula: "M_h2 = R_Bh * b_2"
  }),
  defineRelation({
    id: "eq_shaft_pl_m2",
    name: "Resultant Bending Moment at Pulley",
    canonicalTex: "M_2 = \\sqrt{M_{v2}^2 + M_{h2}^2}",
    formula: "M_2 = sqrt((M_v2^2) + (M_h2^2))"
  })
]);
