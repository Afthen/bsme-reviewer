/**
 * src/topics/machine_design/shafting/overhung_design/relations.js
 * Overhung Shaft Design integrating the Three Distinct Design Checks:
 *   1. Strength:  sigma_b, tau, sigma_vm, n_DE
 *   2. Rigidity:  delta_tip, theta_B, theta_tip, n_delta, n_theta
 *   3. Dynamics:  f_cr, omega_cr, n_cr, r_cr
 * References: Shigley (Table A-9-10, Ch. 7), Mott (Ch. 12).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_SOLID_I,
  EQ_BASE_SHAFT_SOLID_Z,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_SHAFT_TORSION_ZP
} from "../../common/shaft_base_relations.js";

export const SHAFT_OVERHUNG_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_SOLID_I,
  EQ_BASE_SHAFT_SOLID_Z,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_SHAFT_TORSION_ZP,

  // Geometry & Equilibrium
  defineRelation({
    id: "eq_shaft_oh_weight",
    name: "Overhung Rotor Weight",
    canonicalTex: "W = m g",
    formula: "W = m * g"
  }),
  defineRelation({
    id: "eq_shaft_oh_ltot",
    name: "Total Overhung Shaft Length",
    canonicalTex: "L_{tot} = L + a",
    formula: "L_tot = L + a"
  }),
  defineRelation({
    id: "eq_shaft_oh_ra",
    name: "Inboard Bearing A Reaction",
    canonicalTex: "R_A = \\frac{W a}{L}",
    formula: "R_A = (W * a) / L"
  }),
  defineRelation({
    id: "eq_shaft_oh_rb",
    name: "Outboard Bearing B Reaction",
    canonicalTex: "R_B = \\frac{W L_{tot}}{L}",
    formula: "R_B = (W * L_tot) / L"
  }),
  defineRelation({
    id: "eq_shaft_oh_mb",
    name: "Peak Bending Moment at Bearing B",
    canonicalTex: "M_B = W a",
    formula: "M_B = W * a"
  }),

  // Check 1: Strength
  defineRelation({
    id: "eq_shaft_oh_sigmab",
    name: "Maximum Bending Stress at Bearing B",
    canonicalTex: "\\sigma_b = \\frac{M_B}{Z}",
    formula: "sigma_b = M_B / Z"
  }),
  defineRelation({
    id: "eq_shaft_oh_vm",
    name: "Combined von Mises Stress at Bearing B",
    canonicalTex: "\\sigma' = \\sqrt{\\sigma_b^2 + 3 \\tau^2}",
    formula: "sigma_vm = sqrt((sigma_b^2) + 3 * (tau^2))"
  }),
  defineRelation({
    id: "eq_shaft_oh_nde",
    name: "Strength Check: Distortion Energy Safety Factor",
    canonicalTex: "n_{DE} = \\frac{S_y}{\\sigma'}",
    formula: "n_DE = S_y / sigma_vm"
  }),

  // Check 2: Rigidity
  defineRelation({
    id: "eq_shaft_oh_delta_tip",
    name: "Overhung Tip Deflection",
    canonicalTex: "\\delta_{tip} = \\frac{W a^2 L_{tot}}{3 E I}",
    formula: "delta_tip = (W * (a^2) * L_tot) / (3 * E * I)"
  }),
  defineRelation({
    id: "eq_shaft_oh_theta_b",
    name: "Shaft Slope at Bearing B",
    canonicalTex: "\\theta_B = \\frac{W a L}{3 E I}",
    formula: "theta_B = (W * a * L) / (3 * E * I)"
  }),
  defineRelation({
    id: "eq_shaft_oh_theta_tip",
    name: "Shaft Slope at Overhung Tip",
    canonicalTex: "\\theta_{tip} = \\frac{W a (2 L + 3 a)}{6 E I}",
    formula: "theta_tip = (W * a * (2 * L + 3 * a)) / (6 * E * I)"
  }),
  defineRelation({
    id: "eq_shaft_oh_ndelta",
    name: "Rigidity Check: Tip Deflection Margin",
    canonicalTex: "n_{\\delta} = \\frac{\\delta_{allow}}{\\delta_{tip}}",
    formula: "n_delta = delta_allow / delta_tip"
  }),
  defineRelation({
    id: "eq_shaft_oh_ntheta",
    name: "Rigidity Check: Bearing Slope Margin",
    canonicalTex: "n_{\\theta} = \\frac{\\theta_{allow}}{\\theta_B}",
    formula: "n_theta = theta_allow / theta_B"
  }),

  // Check 3: Dynamics
  defineRelation({
    id: "eq_shaft_oh_fcr",
    name: "Dynamics Check: Overhung Critical Frequency",
    canonicalTex: "f_{cr} = \\frac{1}{2\\pi}\\sqrt{\\frac{g}{\\delta_{tip}}}",
    formula: "f_cr = (1 / (2 * pi)) * sqrt(g / delta_tip)"
  }),
  defineRelation({
    id: "eq_shaft_oh_omegacr",
    name: "Overhung Critical Angular Speed",
    canonicalTex: "\\omega_{cr} = 2\\pi f_{cr}",
    formula: "omega_cr = 2 * pi * f_cr"
  }),
  defineRelation({
    id: "eq_shaft_oh_ncr",
    name: "Overhung Critical Speed (RPM)",
    canonicalTex: "\\omega_{cr} = 2\\pi n_{cr}",
    formula: "omega_cr = 2 * pi * n_cr"
  }),
  defineRelation({
    id: "eq_shaft_oh_rcr",
    name: "Dynamics Check: Operating-to-Critical Speed Ratio",
    canonicalTex: "r_{cr} = \\frac{n_{op}}{n_{cr}}",
    formula: "r_cr = n_op / n_cr"
  })
]);
