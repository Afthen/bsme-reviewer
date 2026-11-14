import { RECT_SPIRAL_VARS_DB } from "./schema.js";
import { RECT_SPIRAL_RELATIONS } from "./relations.js";
import { createRectSpiralSystem } from "./system.js";

export const rectSpiralTorsionTopic = Object.freeze({
  id: "md_springs_torsion_rect_spiral",
  title: "Spiral Rectangular Wire",
  subject: "Machine Design",
  category: "Springs / Torsion Springs",
  noun: "rectangular-wire spiral torsion spring",
  varsDb: RECT_SPIRAL_VARS_DB,
  relations: RECT_SPIRAL_RELATIONS,
  createSystem: createRectSpiralSystem
});
