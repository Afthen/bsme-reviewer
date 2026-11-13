/**
 * src/topics/machine_design/springs/helical/square_wire/index.js
 */
import { SQUARE_WIRE_VARS_DB } from "./schema.js";
import { SQUARE_WIRE_RELATIONS } from "./relations.js";
import { createSquareWireSystem } from "./system.js";

export const squareWireTopic = Object.freeze({
  id: "md_springs_helical_square",
  title: "Square Wire",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "square-wire helical coil spring",
  varsDb: SQUARE_WIRE_VARS_DB,
  relations: SQUARE_WIRE_RELATIONS,
  createSystem: createSquareWireSystem
});
