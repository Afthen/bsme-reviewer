/**
 * src/topics/hvac/dryers/schema.js
 * Scoped Dryer Schema covering wet/dry-basis moisture, solid mass conservation,
 * psychrometric air moisture pickup, and thermal efficiency.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";
import { HVAC_BASE_VARS } from "../common/hvac_base_schema.js";

export const DRYER_VARS_DB = Object.freeze({
  "m_f":    { name: "Wet Feed Mass Flow", symbol: "\\dot{m}_f", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Wet Feed Mass Flow", "Wet Material Feed Rate", "Entering Feed Rate"] },
  "m_p":    { name: "Dried Product Mass Flow", symbol: "\\dot{m}_p", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Dried Product Mass Flow", "Dry Product Output Rate", "Leaving Product Rate"] },
  "m_s":    { name: "Bone-Dry Solid Mass Flow", symbol: "\\dot{m}_s", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Bone-Dry Solid Mass Flow", "Dry Solid Flow Rate", "Moisture-Free Solid Rate"] },
  "m_w":    { name: "Moisture Evaporated Rate", symbol: "\\dot{m}_w", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Moisture Evaporated Rate", "Water Removal Rate", "Drying Evaporation Rate"] },
  "M_w1":   { name: "Initial Wet-Basis Moisture", symbol: "M_{w1}", dimension: DIMENSIONS.PERCENTAGE, unit: "%", aliases: ["Initial Wet-Basis Moisture", "Entering Wet-Basis Moisture Content", "Initial Feed Moisture"] },
  "M_w2":   { name: "Final Wet-Basis Moisture", symbol: "M_{w2}", dimension: DIMENSIONS.PERCENTAGE, unit: "%", aliases: ["Final Wet-Basis Moisture", "Leaving Wet-Basis Moisture Content", "Final Product Moisture"] },
  "X_1":    { name: "Initial Dry-Basis Moisture", symbol: "X_1", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Initial Dry-Basis Moisture", "Entering Dry-Basis Moisture Content"] },
  "X_2":    { name: "Final Dry-Basis Moisture", symbol: "X_2", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Final Dry-Basis Moisture", "Leaving Dry-Basis Moisture Content"] },
  "m_a":    { name: "Drying Air Mass Flow", symbol: "\\dot{m}_a", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Drying Air Mass Flow", "Dry Air Flow Rate", "Dryer Air Mass Rate"] },
  "W_1":    { name: "Entering Air Humidity Ratio", symbol: "W_1", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Entering Air Humidity Ratio", "Inlet Air Moisture Content"] },
  "W_2":    { name: "Exhaust Air Humidity Ratio", symbol: "W_2", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Exhaust Air Humidity Ratio", "Leaving Air Moisture Content"] },
  "v_1":    { name: "Entering Air Specific Volume", symbol: "v_1", dimension: DIMENSIONS.VOLUME, unit: "m^3/kg", aliases: ["Entering Air Specific Volume", "Ambient Air Specific Volume"] },
  "V_a":    { name: "Entering Air Volume Flow", symbol: "V_a", dimension: DIMENSIONS.VOLUME_FLOW, unit: "m^3/s", aliases: ["Entering Air Volume Flow", "Dryer Blower Capacity", "Inlet Air Volume Rate"] },
  "t_a1":   { name: "Ambient Air Temperature", symbol: "t_{a1}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Ambient Air Temperature", "Entering Heater Air Temp"] },
  "t_a2":   { name: "Heated Air Temperature", symbol: "t_{a2}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Heated Air Temperature", "Entering Dryer Air Temp"] },
  "c_pa":   HVAC_BASE_VARS.c_pa,
  "Q_h":    { name: "Air Heater Heat Input", symbol: "Q_h", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Air Heater Heat Input", "Heat Supplied to Air", "Dryer Heating Load"] },
  "h_fg":   { name: "Latent Heat of Vaporization", symbol: "h_{fg}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Latent Heat of Vaporization", "Enthalpy of Evaporation"] },
  "Q_evap": { name: "Evaporative Heat Load", symbol: "Q_{evap}", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Evaporative Heat Load", "Heat Used for Evaporation", "Latent Drying Load"] },
  "eta_d":  { name: "Dryer Thermal Efficiency", symbol: "\\eta_d", dimension: DIMENSIONS.PERCENTAGE, unit: "%", aliases: ["Dryer Thermal Efficiency", "Drying Efficiency"] }
});
