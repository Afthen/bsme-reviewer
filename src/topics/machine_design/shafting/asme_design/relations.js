/**
 * src/topics/machine_design/shafting/asme_design/relations.js
 * ASME Code for Design of Transmission Shafting (ASA B17c-1927, withdrawn 1954;
 * superseded by ANSI/ASME B106.1M-1985).
 *
 * Original Code Basis & Assumptions:
 * - Uses Maximum Shear Stress (Guest/Tresca) theory with prescribed shock/fatigue
 *   factors C_m (1.0-3.0) and C_t (1.0-3.0) applied to nominal M and T.
 * - Unkeyed allowable shear stress S_s0 = min(0.30 S_y, 0.18 S_ut); for cold-drawn
 *   AISI 1045 shafting (S_y / S_ut > 0.60), 0.18 S_ut governs.
 * - Keyways at the critical section reduce allowable shear stress by 25% (k_key = 0.75).
 * - Preserved for historical/board-exam competency (Vallance & Doughtie, Spotts, Faires);
 *   do not treat as interchangeable with modern Distortion-Energy fatigue design.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_MOMENT_RES,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_SHAFT_HOLLOW_RATIO
} from "../../common/shaft_base_relations.js";

export const SHAFT_ASME_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_MOMENT_RES,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_SHAFT_HOLLOW_RATIO,

  defineRelation({
    id: "eq_shaft_asme_ss_yield",
    name: "ASME B17c Yield Shear Bound (0.30 Sy)",
    canonicalTex: "S_{s,y} = 0.30 S_y",
    formula: "S_sy_lim = 0.30 * S_y"
  }),
  defineRelation({
    id: "eq_shaft_asme_ss_base",
    name: "ASME B17c Governing Unkeyed Shear Stress (0.18 Sut)",
    canonicalTex: "S_{s0} = 0.18 S_{ut}",
    formula: "S_s0 = 0.18 * S_ut"
  }),
  defineRelation({
    id: "eq_shaft_asme_ss_key",
    name: "ASME B17c Keyway-Adjusted Allowable Shear Stress",
    canonicalTex: "S_s = k_{key} S_{s0}",
    formula: "S_s = k_key * S_s0"
  }),
  defineRelation({
    id: "eq_shaft_asme_mf",
    name: "ASME Factored Bending Moment",
    canonicalTex: "M_f = K_m M",
    formula: "M_f = C_m * M"
  }),
  defineRelation({
    id: "eq_shaft_asme_tf",
    name: "ASME Factored Torque",
    canonicalTex: "T_f = K_t T",
    formula: "T_f = C_t * T"
  }),
  defineRelation({
    id: "eq_shaft_asme_te",
    name: "ASME Equivalent Twisting Moment",
    canonicalTex: "T_e = \\sqrt{M_f^2 + T_f^2}",
    formula: "T_e = sqrt((M_f^2) + (T_f^2))"
  }),
  defineRelation({
    id: "eq_shaft_asme_me",
    name: "ASME Equivalent Bending Moment",
    canonicalTex: "M_e = \\frac{1}{2}(M_f + T_e)",
    formula: "M_e = 0.5 * (M_f + T_e)"
  }),
  defineRelation({
    id: "eq_shaft_asme_zp_req",
    name: "ASME B17c Required Polar Section Modulus",
    canonicalTex: "Z_p = \\frac{T_e}{S_s}",
    formula: "Z_p = T_e / S_s"
  }),
  defineRelation({
    id: "eq_shaft_asme_hollow_do",
    name: "ASME B17c Hollow Shaft Outer Diameter",
    canonicalTex: "d_o = \\frac{d}{(1 - K^4)^{1/3}}",
    formula: "d_o = d / ((1 - (k_d^4)) ^ (1 / 3))"
  }),
  defineRelation({
    id: "eq_shaft_asme_tau_nom",
    name: "Nominal Unfactored Torsional Shear Stress",
    canonicalTex: "\\tau_{nom} = \\frac{T}{Z_p}",
    formula: "tau_nom = T / Z_p"
  }),
  defineRelation({
    id: "eq_shaft_asme_sigma_nom",
    name: "Nominal Unfactored Bending Stress",
    canonicalTex: "\\sigma_{nom} = \\frac{32 M}{\\pi d^3}",
    formula: "sigma_nom = (32 * M) / (pi * (d^3))"
  })
]);
