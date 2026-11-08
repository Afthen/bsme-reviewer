/**
 * test/run_tests.js
 * Automated Node.js test harness for GitHub Actions CI.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALL_TOPICS } from "../src/topics/registry.js";
import { validateTopic } from "./validator.js";

describe("Engineering Topics Ground Truth & AST Inversion Suite", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic: ${topic.title} (${topic.id})`, () => {
      const report = validateTopic(topic);

      if (report.errors.length > 0) {
        console.error(`\n[FAIL] ${topic.title} encountered ${report.errors.length} errors:`);
        report.errors.forEach(err => console.error(`  - ${err}`));
      }

      assert.equal(
        report.errors.length,
        0,
        `${topic.title} has ${report.errors.length} validation errors (tested ${report.testedPairs} pairs).`
      );
    });
  }
});
