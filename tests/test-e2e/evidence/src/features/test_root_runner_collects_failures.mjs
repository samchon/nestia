import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runTests } from "../../../../../scripts/run-tests.cjs";

/**
 * Verifies root test failures preserve independent population results.
 *
 * A failed Go, unit or contract check must not hide later boundaries. A failed
 * package build cannot provide artifacts, but Evidence and source-based Go
 * run.
 *
 * 1. Record actual fixture child commands for successful shared preparation.
 * 2. Fail each independent population and require all five commands to execute.
 * 3. Fail preparation and require build, Evidence and Go, with nonzero status.
 *
 * @evidence contracts/testing.md#behavioral-verification Native fixture children record their arguments and cache paths; exact command sequences and aggregate exits catch short circuiting, lost failures and invocation after unavailable preparation.
 * @evidence contracts/testing.md#independent-expectations One shared build is prerequisite to unit and E2E; Evidence and source-based Go depend only on installed tools. Every failed independent command must contribute nonzero without suppressing another prepared population.
 * @evidence contracts/testing.md#distinguishing-cases All-success and separate Evidence, Go, unit and E2E failures retain the full population; build failure retains independent Evidence and Go. Both absolute compiler cache paths are checked in every child.
 * @evidence contracts/testing.md#execution-ownership Node discovers this exported case through test-e2e's test_*.mjs start command and invokes the actual root orchestration function with a fixture launcher.
 * @evidence contracts/e2e.md#necessary-boundary Real Node children prove command delivery and continuation across nonzero exits; inspecting a list or reducing synthetic result objects cannot establish execution.
 * @evidence contracts/e2e.md#shared-execution One lightweight fixture launcher serves every status permutation without compiling packages or recursively launching the root suite; native process invocation is the boundary under test.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each permutation resets its private log and status file; synchronous children settle before finally removes the owned temporary root, and production artifacts are untouched.
 * @evidence contracts/e2e.md#preserved-coverage Root prerequisite and failure aggregation complement the E2E suite aggregation test; the real package and API behavior remains in the command populations this runner launches.
 */
export const test_root_runner_collects_failures = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-root-runner-"));
  const launcher = path.join(root, "launcher.cjs");
  const log = path.join(root, "commands.jsonl");
  const status = path.join(root, "status.json");
  const expected = ["build", "evidence", "test:go", "test:unit", "test:e2e"];
  try {
    fs.writeFileSync(
      launcher,
      `const fs = require("node:fs");
const command = process.argv[2];
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ command,
  cache: process.env.TTSC_CACHE_DIR, goCache: process.env.GOCACHE }) + "\\n");
const statuses = JSON.parse(fs.readFileSync(${JSON.stringify(status)}, "utf8"));
process.exitCode = statuses[command] ?? 0;
`,
    );
    for (const failed of [null, ...expected.slice(1), "build"]) {
      fs.writeFileSync(
        status,
        JSON.stringify(failed === null ? {} : { [failed]: 1 }),
      );
      fs.writeFileSync(log, "");
      assert.equal(runTests(root, launcher), failed === null ? 0 : 1);
      const entries = fs
        .readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert.deepEqual(
        entries.map((entry) => entry.command),
        failed === "build" ? expected.slice(0, 3) : expected,
      );
      for (const entry of entries) {
        assert.equal(entry.cache, path.join(root, "node_modules/.cache/ttsc"));
        assert.equal(
          entry.goCache,
          path.join(root, "node_modules/.cache/ttsc/go-build"),
        );
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("root runner collects failures", test_root_runner_collects_failures);
