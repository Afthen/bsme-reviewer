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
});
