/**
 * src/topics/registry.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: DOM-Free Universal Topic Registry
 * ============================================================================
 * This file serves as the Single Source of Truth for all engineering topics
 * across both the browser runtime (GitHub Pages) and the automated Node.js CI.
 *
 * PHILOSOPHY:
 * 1. Zero DOM Coupling: Topic schemas and relations must never touch the DOM
 *    so they can be evaluated headlessly in CI and automated test harnesses.
 * 2. Self-Contained Assembly: Topics are assembled here directly from their
 *    modular constituents (schema, relations, system generator) without
 *    needing intermediate directory wrapper files.
 * 3. Scalable Metadata: Each topic declares explicit noun and subject metadata
 *    to eliminate heuristic string stripping (e.g. English pluralization bugs).
 * ============================================================================
 */

import { GEAR_RELATION_GRAPH } from "./machine_design/spur_gears/relations.js";
import { GEAR_VARS_DB } from "./machine_design/spur_gears/schema.js";
import { createGroundTruthSystem } from "./machine_design/spur_gears/system.js";

import { HELICAL_RELATION_GRAPH } from "./machine_design/helical_gears/relations.js";
import { HELICAL_VARS_DB } from "./machine_design/helical_gears/schema.js";
import { createGroundTruthHelicalSystem } from "./machine_design/helical_gears/system.js";

export const TOPICS = Object.freeze({
  spur_gears: {
    id: "spur_gears",
    title: "Spur Gears",
    subject: "Machine Design",
    noun: "spur gear drive",
    varsDb: GEAR_VARS_DB,
    relations: GEAR_RELATION_GRAPH,
    createSystem: createGroundTruthSystem
  },
  helical_gears: {
    id: "helical_gears",
    title: "Helical Gears",
    subject: "Machine Design",
    noun: "helical gear drive",
    varsDb: HELICAL_VARS_DB,
    relations: HELICAL_RELATION_GRAPH,
    createSystem: createGroundTruthHelicalSystem
  }
});

export const ALL_TOPICS = Object.values(TOPICS);
