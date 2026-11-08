/**
 * src/topics/hvac/common/hvac_base_schema.js
 * Universal psychrometric and HVAC variables with exhaustive board-exam aliases.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const HVAC_BASE_VARS = Object.freeze({
  // --- Temperatures ---
  "t_o": { name: "Outside Air Temp", symbol: "t_o", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Outside Air Temperature", "Outdoor Air Temp", "Ambient Air Temp", "Ventilation Air Temp", "Fresh Air Temp", "Make-up Air Temp"] },
  "t_r": { name: "Return Air Temp", symbol: "t_r", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Return Air Temperature", "Room Air Temp", "Indoor Air Temp", "Conditioned Space Temp", "Recirculated Air Temp"] },
  "t_m": { name: "Mixed Air Temp", symbol: "t_m", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Mixed Air Temperature", "Entering Coil Temp", "Mixture Temp", "Air Temp Entering Coil"] },
  "t_s": { name: "Supply Air Temp", symbol: "t_s", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Supply Air Temperature", "Leaving Coil Temp", "Conditioned Air Temp", "Delivery Air Temp", "Air Temp Leaving Coil"] },
  
  // --- Enthalpies ---
  "h_o": { name: "Outside Air Enthalpy", symbol: "h_o", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Outside Air Enthalpy", "Outdoor Enthalpy", "Ambient Enthalpy", "Ventilation Air Enthalpy"] },
  "h_r": { name: "Return Air Enthalpy", symbol: "h_r", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Return Air Enthalpy", "Room Enthalpy", "Indoor Enthalpy", "Recirculated Air Enthalpy"] },
  "h_m": { name: "Mixed Air Enthalpy", symbol: "h_m", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Mixed Air Enthalpy", "Entering Coil Enthalpy", "Mixture Enthalpy"] },
  "h_s": { name: "Supply Air Enthalpy", symbol: "h_s", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Supply Air Enthalpy", "Leaving Coil Enthalpy", "Conditioned Air Enthalpy"] },

  // --- Mass Flow Rates ---
  "m_o": { name: "Outside Air Mass Flow", symbol: "\\dot{m}_o", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Outside Air Mass Flow", "Ventilation Air Rate", "Fresh Air Rate", "Make-up Air Rate", "Outdoor Air Flow"] },
  "m_r": { name: "Return Air Mass Flow", symbol: "\\dot{m}_r", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Return Air Mass Flow", "Recirculated Air Rate", "Room Air Return Rate"] },
  "m_m": { name: "Mixed Air Mass Flow", symbol: "\\dot{m}_m", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Mixed Air Mass Flow", "Total Supply Air Rate", "Coil Air Flow Rate", "Supply Mass Flow"] },

  // --- Loads ---
  "q_c": { name: "Cooling Coil Load", symbol: "q_c", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Cooling Coil Load", "Coil Capacity", "Refrigerating Capacity", "Sensible and Latent Heat Load", "Grand Total Heat", "Total Cooling Load"] }
});
