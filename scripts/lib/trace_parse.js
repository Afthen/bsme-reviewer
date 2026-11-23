/**
 * scripts/lib/trace_parse.js
 * Parses a derivation-matrix case line (as printed by test/derivation_matrix_test.js)
 * into its parts. Pure string handling; shared by fulfill_ctx.js and trace_case.js.
 */

const CASE_RE = /^(\S+?)\[(SI|US)\]\s+(\S+)\s+->\s+(\S+)\s+\{(.*)\}(?:\s+seed=(\d+))?$/;

/** Returns { topicId, sys, relId, target, units, seed|null } or null when malformed. */
export function parseCase(text) {
  const m = String(text).trim().match(CASE_RE);
  if (!m) return null;
  const units = {};
  for (const pair of m[5].split(/,\s*/).filter(Boolean)) {
    const i = pair.indexOf(":");
    if (i <= 0) return null;
    units[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return { topicId: m[1], sys: m[2], relId: m[3], target: m[4], units, seed: m[6] ? Number(m[6]) : null };
}
