/**
 * src/topics/machine_design/springs/helical/rectangular_wire/index.js
 */
import { RECT_WIRE_VARS_DB } from "./schema.js";
import { RECT_WIRE_RELATIONS } from "./relations.js";
import { createRectWireSystem } from "./system.js";

export const rectangularWireTopic = Object.freeze({
  id: "md_springs_helical_rectangular",
  title: "Rectangular Wire",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "rectangular-wire helical coil spring",
  varsDb: RECT_WIRE_VARS_DB,
  relations: RECT_WIRE_RELATIONS,
  createSystem: createRectWireSystem
});
