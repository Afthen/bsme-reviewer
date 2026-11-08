import { pureOutsideAirTopic } from "./air_handling/pure_outside_air/index.js";
import { mixedAirTopic } from "./air_handling/outside_air_with_return/index.js";
import { bypassAirTopic } from "./air_handling/outside_air_with_return_and_bypass/index.js";
import { coolingTowerTopic } from "./cooling_tower/index.js";

export const HVAC_TOPICS = Object.freeze({
  ah_pure_air: pureOutsideAirTopic,
  ah_mixed_air: mixedAirTopic,
  ah_bypass_air: bypassAirTopic,
  cooling_tower: coolingTowerTopic
});
