/**
 * src/topics/machine_design/springs/helical/parallel/system.js
 */
import { createSpringNetworkSystem } from "../../common/spring_systems_helper.js";

export function createParallelSpringsSystem({ sys = "SI", count = 3 } = {}) {
  return createSpringNetworkSystem({ sys, mode: "parallel", count });
}
