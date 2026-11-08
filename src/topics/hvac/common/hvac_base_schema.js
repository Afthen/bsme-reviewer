/**
 * src/topics/hvac/common/hvac_base_schema.js
 * Universal psychrometric and HVAC variables with dual-layer name & symbol aliases.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const HVAC_BASE_VARS = Object.freeze({
  // --- Pressures ---
  "P_v": {
    name: "Actual Vapor Pressure",
    symbol: "P_v",
    nameAliases: ["Actual Vapor Pressure", "Vapor Pressure", "Partial Pressure of Water Vapor"],
    symbolAliases: ["P_v", "P_w", "e"],
    aliases: ["Actual Vapor Pressure", "Vapor Pressure", "Partial Pressure of Water Vapor", "P_v", "P_w"],
    dimension: DIMENSIONS.PRESSURE,
    unit: "kPa"
  },
  "P_sat": {
    name: "Saturation Vapor Pressure",
    symbol: "P_{sat}",
    nameAliases: ["Saturation Vapor Pressure", "Saturation Pressure at Dry Bulb"],
    symbolAliases: ["P_{sat}", "P_s", "P_g"],
    aliases: ["Saturation Vapor Pressure", "Saturation Pressure at Dry Bulb", "P_sat", "P_s", "P_g"],
    dimension: DIMENSIONS.PRESSURE,
    unit: "kPa"
  },
  "P_wb": {
    name: "Saturation Pressure at Wet Bulb",
    symbol: "P_{wb}",
    nameAliases: ["Saturation Pressure at Wet Bulb", "Wet Bulb Saturation Pressure"],
    symbolAliases: ["P_{wb}", "P'_{sat}"],
    aliases: ["Saturation Pressure at Wet Bulb", "Wet Bulb Saturation Pressure", "P_wb"],
    dimension: DIMENSIONS.PRESSURE,
    unit: "kPa"
  },
  "P_t": {
    name: "Barometric Pressure",
    symbol: "P_t",
    nameAliases: ["Barometric Pressure", "Total Atmospheric Pressure", "Atmospheric Pressure"],
    symbolAliases: ["P_t", "P_{atm}", "P_{baro}"],
    aliases: ["Barometric Pressure", "Total Atmospheric Pressure", "Atmospheric Pressure", "P_t", "P_atm", "P_baro"],
    dimension: DIMENSIONS.PRESSURE,
    unit: "kPa"
  },
  "P_a": {
    name: "Partial Pressure of Dry Air",
    symbol: "P_a",
    nameAliases: ["Partial Pressure of Dry Air", "Dry Air Pressure"],
    symbolAliases: ["P_a", "P_{da}"],
    aliases: ["Partial Pressure of Dry Air", "Dry Air Pressure", "P_a"],
    dimension: DIMENSIONS.PRESSURE,
    unit: "kPa"
  },

  // --- Temperatures ---
  "t_db": {
    name: "Dry-Bulb Temperature",
    symbol: "t_{db}",
    nameAliases: ["Dry-Bulb Temperature", "Dry Bulb Temp", "Ambient Air Temp"],
    symbolAliases: ["t_{db}", "\\text{DBT}", "T_{db}"],
    aliases: ["Dry-Bulb Temperature", "Dry Bulb Temp", "Ambient Air Temp", "t_db", "DBT"],
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C"
  },
  "t_wb": {
    name: "Wet-Bulb Temperature",
    symbol: "t_{wb}",
    nameAliases: ["Wet-Bulb Temperature", "Wet Bulb Temp"],
    symbolAliases: ["t_{wb}", "\\text{WBT}", "T_{wb}"],
    aliases: ["Wet-Bulb Temperature", "Wet Bulb Temp", "t_wb", "WBT"],
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C"
  },
  "t_dp": {
    name: "Dew Point Temperature",
    symbol: "t_{dp}",
    nameAliases: ["Dew Point Temperature", "Dew Point Temp"],
    symbolAliases: ["t_{dp}", "\\text{DPT}", "T_{dp}"],
    aliases: ["Dew Point Temperature", "Dew Point Temp", "t_dp", "DPT"],
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C"
  },

  // --- Psychrometric Properties ---
  "W": {
    name: "Humidity Ratio",
    symbol: "W",
    nameAliases: ["Humidity Ratio", "Specific Humidity", "Moisture Content", "Mixing Ratio"],
    symbolAliases: ["W", "\\text{HR}", "\\omega", "w"],
    aliases: ["Humidity Ratio", "Specific Humidity", "Moisture Content", "Mixing Ratio", "W", "HR"],
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless"
  },
  "RH": {
    name: "Relative Humidity",
    symbol: "\\text{RH}",
    nameAliases: ["Relative Humidity", "Degree of Saturation"],
    symbolAliases: ["\\text{RH}", "\\phi"],
    aliases: ["Relative Humidity", "Degree of Saturation", "RH"],
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless"
  },
  "h": {
    name: "Enthalpy of Moist Air",
    symbol: "h",
    nameAliases: ["Enthalpy of Moist Air", "Air Enthalpy", "Total Heat of Air"],
    symbolAliases: ["h", "H"],
    aliases: ["Enthalpy of Moist Air", "Air Enthalpy", "Total Heat of Air", "h"],
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg"
  },
  "v": {
    name: "Specific Volume of Moist Air",
    symbol: "v",
    nameAliases: ["Specific Volume of Moist Air", "Moist Air Specific Volume"],
    symbolAliases: ["v", "V_s"],
    aliases: ["Specific Volume of Moist Air", "Moist Air Specific Volume", "v"],
    dimension: DIMENSIONS.VOLUME,
    unit: "m^3"
  },

  // --- Sensible & Latent Heat Ratios ---
  "SHR": {
    name: "Sensible Heat Ratio",
    symbol: "\\text{SHR}",
    nameAliases: ["Sensible Heat Ratio", "Sensible Heat Factor"],
    symbolAliases: ["\\text{SHR}", "\\text{SHF}"],
    aliases: ["Sensible Heat Ratio", "Sensible Heat Factor", "SHR", "SHF"],
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless"
  },
  "Q_s": {
    name: "Sensible Heat Load",
    symbol: "Q_s",
    nameAliases: ["Sensible Heat Load", "Sensible Heat Capacity"],
    symbolAliases: ["Q_s", "q_s"],
    aliases: ["Sensible Heat Load", "Sensible Heat Capacity", "Q_s"],
    dimension: DIMENSIONS.POWER,
    unit: "kW"
  },
  "Q_l": {
    name: "Latent Heat Load",
    symbol: "Q_l",
    nameAliases: ["Latent Heat Load", "Latent Heat Capacity"],
    symbolAliases: ["Q_l", "q_l"],
    aliases: ["Latent Heat Load", "Latent Heat Capacity", "Q_l"],
    dimension: DIMENSIONS.POWER,
    unit: "kW"
  },
  "Q_t": {
    name: "Total Heat Load",
    symbol: "Q_t",
    nameAliases: ["Total Heat Load", "Total Cooling Heat"],
    symbolAliases: ["Q_t", "q_t"],
    aliases: ["Total Heat Load", "Total Cooling Heat", "Q_t"],
    dimension: DIMENSIONS.POWER,
    unit: "kW"
  },

  // --- Air Handling Stream Nodes (for compatibility) ---
  "t_o": { name: "Outside Air Temp", symbol: "t_o", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Outside Air Temperature", "Outdoor Air Temp", "Ambient Air Temp"] },
  "t_r": { name: "Return Air Temp", symbol: "t_r", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Return Air Temperature", "Room Air Temp", "Indoor Air Temp"] },
  "t_m": { name: "Mixed Air Temp", symbol: "t_m", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Mixed Air Temperature", "Entering Coil Temp", "Mixture Temp"] },
  "t_s": { name: "Supply Air Temp", symbol: "t_s", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Supply Air Temperature", "Leaving Coil Temp", "Conditioned Air Temp"] },
  "h_o": { name: "Outside Air Enthalpy", symbol: "h_o", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Outside Air Enthalpy", "Outdoor Enthalpy"] },
  "h_r": { name: "Return Air Enthalpy", symbol: "h_r", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Return Air Enthalpy", "Room Enthalpy"] },
  "h_m": { name: "Mixed Air Enthalpy", symbol: "h_m", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Mixed Air Enthalpy", "Entering Coil Enthalpy"] },
  "h_s": { name: "Supply Air Enthalpy", symbol: "h_s", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Supply Air Enthalpy", "Leaving Coil Enthalpy"] },
  "m_o": { name: "Outside Air Mass Flow", symbol: "\\dot{m}_o", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Outside Air Mass Flow", "Ventilation Air Rate"] },
  "m_r": { name: "Return Air Mass Flow", symbol: "\\dot{m}_r", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Return Air Mass Flow", "Recirculated Air Rate"] },
  "m_m": { name: "Mixed Air Mass Flow", symbol: "\\dot{m}_m", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Mixed Air Mass Flow", "Total Supply Air Rate"] },
  "q_c": { name: "Cooling Coil Load", symbol: "q_c", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Cooling Coil Load", "Coil Capacity", "Refrigerating Capacity"] }
});
