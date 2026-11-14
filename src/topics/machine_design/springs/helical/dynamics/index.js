import { DYNAMICS_VARS_DB } from "./schema.js";
import { DYNAMICS_RELATIONS } from "./relations.js";
import { createDynamicsSystem } from "./system.js";
export const springDynamicsTopic = Object.freeze({
  id: "md_springs_helical_dynamics",
  title: "Dynamics (Period & Frequency)",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "vibrating spring-mass and pendulum system",
  varsDb: DYNAMICS_VARS_DB,
  relations: DYNAMICS_RELATIONS,
  createSystem: createDynamicsSystem
});
