/**
 * scripts/quiet_reporter.js
 * Node --test custom reporter that suppresses passing tests and prints only
 * leaf failures plus a single summary line.
 */

import path from "node:path";

function indent(str, pad) {
  return String(str).split("\n").map(line => `${pad}${line}`).join("\n");
}

export default async function* quietReporter(source) {
  const startedAt = Date.now();
  let passed = 0;
  let failed = 0;

  for await (const event of source) {
    const data = event.data || {};
    const details = data.details || {};

    if (event.type === "test:pass") {
      if (details.type !== "suite") passed++;
      continue;
    }

    if (event.type === "test:fail") {
      const err = details.error;
      const root = err?.cause || err;
      const msgText = String(root?.message || root || "");
      const isHookFailure = err?.failureType === "hookFailed" ||
        err?.failureType === "uncaughtException" ||
        err?.failureType === "unhandledRejection";
      if (
        err?.failureType === "subtestFailed" ||
        (details.type === "suite" && !isHookFailure) ||
        /^\d+ subtests? failed$/.test(msgText.trim())
      ) {
        continue;
      }
      failed++;
      const fileLoc = data.file
        ? `${path.relative(process.cwd(), data.file).replace(/\\/g, "/")}${data.line ? `:${data.line}` : ""} `
        : "";
      const msg = root?.stack || root?.message || String(root || "Test failed");
      yield `\n✖ ${fileLoc}${data.name || "(unnamed)"}\n${indent(msg, "  ")}\n`;
      continue;
    }

    if (event.type === "test:stdout" || event.type === "test:stderr") {
      if (data.message) yield data.message;
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
  yield `[test] ${passed} passed, ${failed} failed (${elapsed}s)\n`;
}
