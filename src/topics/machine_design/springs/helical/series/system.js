/**
 * src/topics/machine_design/springs/helical/series/system.js
 */
import { createSpringNetworkSystem } from "../../common/spring_systems_helper.js";

export function createSeriesSpringsSystem({ sys = "SI", count = 3 } = {}) {
  return createSpringNetworkSystem({ sys, mode: "series", count });
}
