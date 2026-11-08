/**
 * src/topics/hvac/index.js
 * HVAC topic exports with keys strictly aligned to topic IDs.
 */

import { pureOutsideAirTopic } from "./air_handling/pure_outside_air/index.js";
import { mixedAirTopic } from "./air_handling/outside_air_with_return/index.js";
import { bypassAirTopic } from "./air_handling/outside_air_with_return_and_bypass/index.js";
import { coolingTowerTopic } from "./cooling_tower/index.js";

export const HVAC_TOPICS = Object.freeze({
  hvac_pure_outside_air: pureOutsideAirTopic,
  hvac_mixed_air: mixedAirTopic,
  hvac_bypass_air: bypassAirTopic,
  hvac_cooling_tower: coolingTowerTopic
});
