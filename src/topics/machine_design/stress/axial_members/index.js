/**
 * src/topics/machine_design/stress/axial_members/index.js
 * Stepped & Indeterminate Axial Members Topic.
 */

import { AXIAL_MEMBERS_VARS_DB } from "./schema.js";
import { AXIAL_MEMBERS_RELATIONS } from "./relations.js";
import { createAxialMembersSystem } from "./system.js";

export const axialMembersTopic = Object.freeze({
  id: "stress_axial_members",
  title: "Axial Stress & Indeterminate Bars",
  subject: "Machine Design",
  category: "Stress",
  noun: "two-segment stepped axial bar assembly",
  varsDb: AXIAL_MEMBERS_VARS_DB,
  relations: AXIAL_MEMBERS_RELATIONS,
  createSystem: createAxialMembersSystem
});
