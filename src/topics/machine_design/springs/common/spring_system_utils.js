/**
 * src/topics/machine_design/springs/common/spring_system_utils.js
 * Shared name/material helpers for Springs ground-truth generators.
 */

export function buildVarNames(varsDb) {
  const _names = {};
  for (const [k, meta] of Object.entries(varsDb)) {
    if (!meta.isAbstract) {
      _names[k] = meta.nameAliases?.[0] || meta.aliases?.[0] || meta.name;
    }
  }
  return _names;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Standard carbon/alloy spring steel elastic constants:
 * Shigley's Mechanical Engineering Design (11th ed., Table 10-5, p. 518):
 * G ≈ 79.3–80 GPa (11,500 ksi), E ≈ 207 GPa (30,000 ksi).
 */
export function getSpringSteelModuli(isUS) {
  return isUS
    ? { G: 11500, E: 30000, unit: "ksi" }
    : { G: 80, E: 207, unit: "GPa" };
}
