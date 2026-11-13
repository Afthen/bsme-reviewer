/**
 * src/topics/machine_design/springs/helical/series/index.js
 */
import {
  buildSpringNetworkSchema,
  buildSpringNetworkRelations,
  createSpringNetworkSystem
} from "../../common/spring_systems_helper.js";
import { SERIES_SPRINGS_VARS_DB } from "./schema.js";
import { SERIES_SPRINGS_RELATIONS } from "./relations.js";
import { createSeriesSpringsSystem } from "./system.js";

export const seriesSpringsTopic = Object.freeze({
  id: "md_springs_helical_series",
  title: "Series Systems",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "series-connected helical spring system",
  countRange: [2, 4],
  varsDb: SERIES_SPRINGS_VARS_DB,
  relations: SERIES_SPRINGS_RELATIONS,
  createSystem: createSeriesSpringsSystem,
  instantiate(count = 3) {
    return {
      varsDb: buildSpringNetworkSchema(count),
      relations: buildSpringNetworkRelations("series", count),
      createSystem: ({ sys = "SI" } = {}) => createSpringNetworkSystem({ sys, mode: "series", count })
    };
  }
});
