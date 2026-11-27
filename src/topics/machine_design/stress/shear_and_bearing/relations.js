/**
 * src/topics/machine_design/stress/shear_and_bearing/relations.js
 * Relations for Direct Shear, Bearing, Net-Section Tension & Tear-Out Connections.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const SHEAR_BEARING_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_sb_shear_area",
    name: "Circular Fastener Shear Area",
    canonicalTex: "A_s = \\frac{\\pi d^2}{4}",
    formula: "A_s = (pi * (d^2)) / 4"
  }),
  defineRelation({
    id: "eq_stress_sb_direct_shear",
    name: "Average Direct Shear Stress",
    canonicalTex: "\\tau = \\frac{F}{n_s n_f A_s}",
    formula: "tau = F / (n_s * n_f * A_s)"
  }),
  defineRelation({
    id: "eq_stress_sb_bearing_area",
    name: "Projected Bearing Area",
    canonicalTex: "A_b = t d",
    formula: "A_b = t * d"
  }),
  defineRelation({
    id: "eq_stress_sb_bearing_stress",
    name: "Bearing Contact Stress",
    canonicalTex: "\\sigma_{br} = \\frac{F}{n_f A_b}",
    formula: "sigma_br = F / (n_f * A_b)"
  }),
  defineRelation({
    id: "eq_stress_sb_net_area",
    name: "Net-Section Plate Area",
    canonicalTex: "A_{net} = (w - n_f d) t",
    formula: "A_net = (w - n_f * d) * t"
  }),
  defineRelation({
    id: "eq_stress_sb_net_stress",
    name: "Net-Section Tensile Stress",
    canonicalTex: "\\sigma_{net} = \\frac{F}{A_{net}}",
    formula: "sigma_net = F / A_net"
  }),
  defineRelation({
    id: "eq_stress_sb_tear_area",
    name: "Edge Tear-Out Shear Area",
    canonicalTex: "A_{tear} = 2 e t",
    formula: "A_tear = 2 * e_edge * t"
  }),
  defineRelation({
    id: "eq_stress_sb_tear_stress",
    name: "Edge Tear-Out Shear Stress",
    canonicalTex: "\\tau_{tear} = \\frac{F}{n_f A_{tear}}",
    formula: "tau_tear = F / (n_f * A_tear)"
  }),
  defineRelation({
    id: "eq_stress_sb_fos_shear",
    name: "Fastener Shear Safety Factor",
    canonicalTex: "n_{sh} = \\frac{S_{sy}}{\\tau}",
    formula: "n_sh = S_sy / tau"
  }),
  defineRelation({
    id: "eq_stress_sb_fos_bearing",
    name: "Bearing Crushing Safety Factor",
    canonicalTex: "n_{br} = \\frac{S_{yc}}{\\sigma_{br}}",
    formula: "n_br = S_yc / sigma_br"
  }),
  defineRelation({
    id: "eq_stress_sb_fos_tension",
    name: "Net-Section Tensile Safety Factor",
    canonicalTex: "n_{tn} = \\frac{S_y}{\\sigma_{net}}",
    formula: "n_tn = S_y / sigma_net"
  }),
  defineRelation({
    id: "eq_stress_sb_fos_tear",
    name: "Edge Tear-Out Safety Factor",
    canonicalTex: "n_{tr} = \\frac{S_{sy}}{\\tau_{tear}}",
    formula: "n_tr = S_sy / tau_tear"
  })
]);
