/**
 * scripts/lib/trace_hooks.js
 * Temporarily wraps Array.prototype.push and .fill to record every numeric value
 * that fails a predicate, with the originating stack frames. Always restores the
 * prototype, even if the traced function throws.
 */

export function recordNumericPushes(isBad, fn, { frameFilter = /\/src\// } = {}) {
  const hits = [];
  let busy = false;
  const origPush = Array.prototype.push;
  const origFill = Array.prototype.fill;
  const origLimit = Error.stackTraceLimit;

  const rec = (kind, vals) => {
    if (busy) return;
    busy = true;
    try {
      for (const v of vals) {
        if (typeof v !== "number" || !Number.isFinite(v) || !isBad(v)) continue;
        const frames = (new Error().stack || "").split("\n").slice(2).filter((l) => frameFilter.test(l));
        if (frames.length) hits.push({ kind, value: v, frames: frames.slice(0, 6).map((l) => l.trim()) });
      }
    } finally { busy = false; }
  };

  Array.prototype.push = function (...a) { rec("push", a); return origPush.apply(this, a); };
  Array.prototype.fill = function (...a) { rec("fill", a.slice(0, 1)); return origFill.apply(this, a); };
  Error.stackTraceLimit = 30;
  try {
    return { result: fn(), hits };
  } finally {
    Array.prototype.push = origPush;
    Array.prototype.fill = origFill;
    Error.stackTraceLimit = origLimit;
  }
}
