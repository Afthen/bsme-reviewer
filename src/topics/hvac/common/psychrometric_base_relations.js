/**
 * src/topics/hvac/common/psychrometric_base_relations.js
 * Universal psychrometric and air property relations (Sta. Maria / Carrier / Liley formulation).
 * Binds requiredUnits contracts to empirical formulas to lock physical unit scaling.
 */

export const PSYCHROMETRIC_BASE_RELATIONS = Object.freeze([
  // 1. Liley Saturation Pressure at Dry-Bulb Temp (Psat = L(tdb))
  {
    id: "eq_psat_db",
    name: "Saturation Vapor Pressure at Dry-Bulb",
    canonicalTex: "P_{sat} = 100 e^{14.43509 - \\frac{5333.33}{t_{db} + 273.15}}",
    baseFormula: "P_sat = 100 * exp(14.43509 - 5333.33 / (t_db + 273.15))",
    nodes: ["P_sat", "t_db"],
    requiredUnits: { t_db: "°C", P_sat: "kPa" }
  },

  // 2. Liley Saturation Pressure at Wet-Bulb Temp (Pwb = L(twb))
  {
    id: "eq_pwb_wb",
    name: "Saturation Vapor Pressure at Wet-Bulb",
    canonicalTex: "P_{wb} = 100 e^{14.43509 - \\frac{5333.33}{t_{wb} + 273.15}}",
    baseFormula: "P_wb = 100 * exp(14.43509 - 5333.33 / (t_wb + 273.15))",
    nodes: ["P_wb", "t_wb"],
    requiredUnits: { t_wb: "°C", P_wb: "kPa" }
  },

  // 3. Liley Saturation Pressure at Dew-Point Temp (Pv = L(tdp))
  {
    id: "eq_pv_dp",
    name: "Vapor Pressure from Dew Point (Liley)",
    canonicalTex: "P_v = 100 e^{14.43509 - \\frac{5333.33}{t_{dp} + 273.15}}",
    baseFormula: "P_v = 100 * exp(14.43509 - 5333.33 / (t_dp + 273.15))",
    nodes: ["P_v", "t_dp"],
    requiredUnits: { t_dp: "°C", P_v: "kPa" }
  },

  // 4. Carrier's Equation for Actual Vapor Pressure
  {
    id: "eq_carrier_pv",
    name: "Carrier's Vapor Pressure Equation",
    canonicalTex: "P_v = P_{wb} - \\frac{P_t (t_{db} - t_{wb})}{1500}",
    baseFormula: "P_v = P_wb - (P_t * (t_db - t_wb)) / 1500",
    nodes: ["P_v", "P_wb", "P_t", "t_db", "t_wb"],
    requiredUnits: { P_v: "kPa", P_wb: "kPa", P_t: "kPa", t_db: "°C", t_wb: "°C" }
  },

  // 5. Humidity Ratio (Specific Humidity) - Pure Ratio Equation
  {
    id: "eq_humidity_ratio",
    name: "Humidity Ratio Definition",
    canonicalTex: "W = \\frac{0.622 P_v}{P_t - P_v}",
    baseFormula: "W = 0.622 * P_v / (P_t - P_v)",
    nodes: ["W", "P_v", "P_t"]
  },

  // 6. Relative Humidity - Pure Ratio Equation
  {
    id: "eq_relative_humidity",
    name: "Relative Humidity Definition",
    canonicalTex: "RH = \\frac{P_v}{P_{sat}}",
    baseFormula: "RH = P_v / P_sat",
    nodes: ["RH", "P_v", "P_sat"]
  },

  // 7. Enthalpy of Moist Air
  {
    id: "eq_air_enthalpy",
    name: "Moist Air Enthalpy",
    canonicalTex: "h = 1.0062 t_{db} + W (2501 + 1.88 t_{db})",
    baseFormula: "h = 1.0062 * t_db + W * (2501 + 1.88 * t_db)",
    nodes: ["h", "t_db", "W"],
    requiredUnits: { h: "kJ/kg", t_db: "°C", W: "dimless" }
  },

  // 8. Dalton's Law of Partial Pressures - Direct Sum
  {
    id: "eq_dalton_pressure",
    name: "Dalton's Law of Partial Pressures",
    canonicalTex: "P_t = P_a + P_v",
    baseFormula: "P_t = P_a + P_v",
    nodes: ["P_t", "P_a", "P_v"]
  },

  // 9. Specific Volume of Moist Air
  {
    id: "eq_specific_volume",
    name: "Specific Volume of Dry Air",
    canonicalTex: "v = \\frac{0.287 (t_{db} + 273.15)}{P_t - P_v}",
    baseFormula: "v = 0.287 * (t_db + 273.15) / (P_t - P_v)",
    nodes: ["v", "t_db", "P_t", "P_v"],
    requiredUnits: { v: "m^3", t_db: "°C", P_t: "kPa", P_v: "kPa" }
  },

  // 10. Sensible Heat Ratio (SHR) - Pure Ratio
  {
    id: "eq_shr",
    name: "Sensible Heat Ratio",
    canonicalTex: "\\text{SHR} = \\frac{Q_s}{Q_s + Q_l}",
    baseFormula: "SHR = Q_s / (Q_s + Q_l)",
    nodes: ["SHR", "Q_s", "Q_l"]
  },

  // 11. Total Heat Load - Direct Sum
  {
    id: "eq_total_heat",
    name: "Total Heat Load",
    canonicalTex: "Q_t = Q_s + Q_l",
    baseFormula: "Q_t = Q_s + Q_l",
    nodes: ["Q_t", "Q_s", "Q_l"]
  }
]);
