/**
 * src/topics/machine_design/stress/fatigue/schema.js
 * Schema for Fluctuating Stress, Marin Endurance Limit, Basquin S-N Curve & Fatigue Criteria (Part X, Sec. 18-20).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const FATIGUE_VARS_DB = Object.freeze({
  S_ut: STRESS_BASE_VARS.S_ut,
  S_y: STRESS_BASE_VARS.S_y,
  S_e: STRESS_BASE_VARS.S_e,
  sigma_a: STRESS_BASE_VARS.sigma_a,
  sigma_m: STRESS_BASE_VARS.sigma_m,

  "d": {
    name: "Specimen Critical Diameter",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Specimen Critical Diameter", "Rotating Bending Diameter"],
    symbolAliases: ["d"],
    aliases: ["Specimen Critical Diameter", "Rotating Bending Diameter"]
  },
  "K_t": {
    name: "Theoretical Stress Concentration Factor",
    symbol: "K_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Theoretical Stress Concentration Factor", "Geometric Fatigue Factor"],
    symbolAliases: ["K_t"],
    aliases: ["Theoretical Stress Concentration Factor", "Geometric Fatigue Factor"]
  },
  "q": {
    name: "Notch Sensitivity Factor",
    symbol: "q",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Notch Sensitivity Factor", "Material Notch Sensitivity"],
    symbolAliases: ["q"],
    aliases: ["Notch Sensitivity Factor", "Material Notch Sensitivity"]
  },
  "K_f": {
    name: "Fatigue Stress Concentration Factor",
    symbol: "K_f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fatigue Stress Concentration Factor", "Effective Fatigue Concentration Factor"],
    symbolAliases: ["K_f"],
    aliases: ["Fatigue Stress Concentration Factor", "Effective Fatigue Concentration Factor"]
  },
  "sigma_a0": {
    name: "Nominal Alternating Stress",
    symbol: "\\sigma_{a0}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Alternating Stress", "Uncorrected Stress Amplitude"],
    symbolAliases: ["\\sigma_{a0}"],
    aliases: ["Nominal Alternating Stress", "Uncorrected Stress Amplitude"]
  },
  "sigma_m0": {
    name: "Nominal Mean Stress",
    symbol: "\\sigma_{m0}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Mean Stress", "Uncorrected Midrange Stress"],
    symbolAliases: ["\\sigma_{m0}"],
    aliases: ["Nominal Mean Stress", "Uncorrected Midrange Stress"]
  },
  "sigma_max": {
    name: "Maximum Cyclic Stress",
    symbol: "\\sigma_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Cyclic Stress", "Peak Local Fatigue Stress"],
    symbolAliases: ["\\sigma_{max}"],
    aliases: ["Maximum Cyclic Stress", "Peak Local Fatigue Stress"]
  },
  "sigma_min": {
    name: "Minimum Cyclic Stress",
    symbol: "\\sigma_{min}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Minimum Cyclic Stress", "Valley Local Fatigue Stress"],
    symbolAliases: ["\\sigma_{min}"],
    aliases: ["Minimum Cyclic Stress", "Valley Local Fatigue Stress"]
  },
  "d_sigma": {
    name: "Cyclic Stress Range",
    symbol: "\\Delta\\sigma",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Cyclic Stress Range", "Total Peak-to-Valley Stress Range"],
    symbolAliases: ["\\Delta\\sigma", "\\sigma_r"],
    aliases: ["Cyclic Stress Range", "Total Peak-to-Valley Stress Range"]
  },
  "R_s": {
    name: "Cyclic Stress Ratio",
    symbol: "R",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Cyclic Stress Ratio", "Min-to-Max Stress Ratio"],
    symbolAliases: ["R", "R_s"],
    aliases: ["Cyclic Stress Ratio", "Min-to-Max Stress Ratio"]
  },
  "A_s": {
    name: "Stress Amplitude Ratio",
    symbol: "A",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Stress Amplitude Ratio", "Alternating-to-Mean Ratio"],
    symbolAliases: ["A", "A_s"],
    aliases: ["Stress Amplitude Ratio", "Alternating-to-Mean Ratio"]
  },
  "S_ep": {
    name: "Rotary-Beam Endurance Limit",
    symbol: "S_e'",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Rotary-Beam Endurance Limit", "Uncorrected Endurance Limit"],
    symbolAliases: ["S_e'", "S_n'"],
    aliases: ["Rotary-Beam Endurance Limit", "Uncorrected Endurance Limit"]
  },
  "a_s": {
    name: "Surface Finish Coefficient",
    symbol: "a",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Surface Finish Coefficient", "Marin Surface Multiplier"],
    symbolAliases: ["a"],
    aliases: ["Surface Finish Coefficient", "Marin Surface Multiplier"]
  },
  "b_s": {
    name: "Surface Finish Exponent",
    symbol: "b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Surface Finish Exponent", "Marin Surface Power Exponent"],
    symbolAliases: ["b"],
    aliases: ["Surface Finish Exponent", "Marin Surface Power Exponent"]
  },
  "k_a": {
    name: "Marin Surface Condition Factor",
    symbol: "k_a",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Surface Condition Factor", "Surface Finish Factor"],
    symbolAliases: ["k_a"],
    aliases: ["Marin Surface Condition Factor", "Surface Finish Factor"]
  },
  "k_b": {
    name: "Marin Size Factor",
    symbol: "k_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Size Factor", "Diameter Size Factor"],
    symbolAliases: ["k_b"],
    aliases: ["Marin Size Factor", "Diameter Size Factor"]
  },
  "k_c": {
    name: "Marin Loading Factor",
    symbol: "k_c",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Loading Factor", "Load Type Modification Factor"],
    symbolAliases: ["k_c"],
    aliases: ["Marin Loading Factor", "Load Type Modification Factor"]
  },
  "k_d": {
    name: "Marin Temperature Factor",
    symbol: "k_d",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Temperature Factor", "Operating Temperature Endurance Factor"],
    symbolAliases: ["k_d"],
    aliases: ["Marin Temperature Factor", "Operating Temperature Endurance Factor"]
  },
  "k_e": {
    name: "Marin Reliability Factor",
    symbol: "k_e",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Reliability Factor", "Survival Reliability Factor"],
    symbolAliases: ["k_e"],
    aliases: ["Marin Reliability Factor", "Survival Reliability Factor"]
  },
  "k_f_misc": {
    name: "Marin Miscellaneous Effects Factor",
    symbol: "k_f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Marin Miscellaneous Effects Factor", "Miscellaneous Endurance Factor"],
    symbolAliases: ["k_f"],
    aliases: ["Marin Miscellaneous Effects Factor", "Miscellaneous Endurance Factor"]
  },
  "f_fat": {
    name: "Fatigue Strength Fraction (10^3 Cycles)",
    symbol: "f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Fatigue Strength Fraction (10^3 Cycles)", "Low-Cycle Strength Fraction"],
    symbolAliases: ["f"],
    aliases: ["Fatigue Strength Fraction (10^3 Cycles)", "Low-Cycle Strength Fraction"]
  },
  "a_f": {
    name: "Basquin S-N Coefficient",
    symbol: "a_f",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Basquin S-N Coefficient", "S-N Intercept Coefficient"],
    symbolAliases: ["a_f", "a"],
    aliases: ["Basquin S-N Coefficient", "S-N Intercept Coefficient"]
  },
  "b_f": {
    name: "Basquin S-N Exponent",
    symbol: "b_f",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Basquin S-N Exponent", "S-N Slope Exponent"],
    symbolAliases: ["b_f", "b"],
    aliases: ["Basquin S-N Exponent", "S-N Slope Exponent"]
  },
  "N_c": {
    name: "Fatigue Life Cycles",
    symbol: "N",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    nameAliases: ["Fatigue Life Cycles", "Number of Load Cycles"],
    symbolAliases: ["N", "N_c"],
    aliases: ["Fatigue Life Cycles", "Number of Load Cycles"]
  },
  "S_f": {
    name: "Finite-Life Fatigue Strength",
    symbol: "S_f",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Finite-Life Fatigue Strength", "Fatigue Strength at N Cycles"],
    symbolAliases: ["S_f"],
    aliases: ["Finite-Life Fatigue Strength", "Fatigue Strength at N Cycles"]
  },
  "n_G": {
    name: "Modified Goodman Fatigue Safety Factor",
    symbol: "n_G",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Modified Goodman Fatigue Safety Factor", "Goodman Factor of Safety"],
    symbolAliases: ["n_G", "n_f"],
    aliases: ["Modified Goodman Fatigue Safety Factor", "Goodman Factor of Safety"]
  },
  "n_S": {
    name: "Soderberg Fatigue Safety Factor",
    symbol: "n_S",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Soderberg Fatigue Safety Factor", "Soderberg Factor of Safety"],
    symbolAliases: ["n_S"],
    aliases: ["Soderberg Fatigue Safety Factor", "Soderberg Factor of Safety"]
  },
  "n_AE": {
    name: "ASME Elliptic Fatigue Safety Factor",
    symbol: "n_{AE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["ASME Elliptic Fatigue Safety Factor", "ASME Elliptic Factor of Safety"],
    symbolAliases: ["n_{AE}"],
    aliases: ["ASME Elliptic Fatigue Safety Factor", "ASME Elliptic Factor of Safety"]
  },
  "n_Gb": {
    name: "Gerber Fatigue Safety Factor",
    symbol: "n_{Gb}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Gerber Fatigue Safety Factor", "Gerber Parabolic Factor of Safety"],
    symbolAliases: ["n_{Gb}"],
    aliases: ["Gerber Fatigue Safety Factor", "Gerber Parabolic Factor of Safety"]
  },
  "n_y": {
    name: "Langer First-Cycle Yield Safety Factor",
    symbol: "n_y",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Langer First-Cycle Yield Safety Factor", "Static Yield Fatigue Check"],
    symbolAliases: ["n_y"],
    aliases: ["Langer First-Cycle Yield Safety Factor", "Static Yield Fatigue Check"]
  }
});
