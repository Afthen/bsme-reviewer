import { DIESEL_HEAT_BALANCE_VARS_DB } from "./schema.js";
import { DIESEL_HEAT_BALANCE_RELATIONS } from "./relations.js";
import { createDieselHeatBalanceSystem } from "./system.js";

export const dieselHeatBalanceTopic = Object.freeze({
  id: "powerplant_design_diesel_heat_balance",
  title: "Diesel Heat Balance",
  subject: "Powerplant Design",
  category: "Internal Combustion Engines",
  noun: "Diesel engine heat balance and thermal distribution",
  varsDb: DIESEL_HEAT_BALANCE_VARS_DB,
  relations: DIESEL_HEAT_BALANCE_RELATIONS,
  createSystem: createDieselHeatBalanceSystem,
  cycleGivens: ["Q_f", "pct_ip", "pct_cw", "pct_exh", "dT_cw", "cp_w"],
  primaryGoals: ["m_cw", "pct_rad", "Q_rad", "Q_exh", "Q_cw", "Q_ip"],
  terminalGoals: ["m_cw", "Q_rad"]
});
