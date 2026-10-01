import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runE2E } from "../../../../scripts/run-e2e.cjs";

/**
 * Verifies failed boundary suites do not suppress later execution.
 *
 * Aggregate failure must retain every suite's result, while a benchmark build
 * failure must prevent running its unavailable output. Fixture children record
 * their received arguments and environment rather than inspecting runner text.
 *
 * 1. Execute the runner with all fixture commands successful.
 * 2. Fail the first suite and verify later suites and benchmark still execute.
 * 3. Fail benchmark preparation and verify its dependent test is withheld.
 *
 * @evidence contracts/testing.md#behavioral-verification Real fixture launcher children record every command and cache/build environment; assertions distinguish early abort, missed suites, lost failures and execution after failed benchmark preparation.
 * @evidence contracts/testing.md#independent-expectations The five independent preparation suites share one parallel/no-bail pnpm dispatch, followed by exclusive SDK and benchmark build/test. Nonzero child results must make the aggregate fail, and failed preparation cannot provide a test artifact.
 * @evidence contracts/testing.md#distinguishing-cases All-success, first-suite failure and final-build failure use separate logs; SDK alone receives the package-build reuse flag, and every invocation receives the same absolute native cache.
 * @evidence contracts/testing.md#execution-ownership Node registers this exported function in test-evidence's start command; it invokes the actual orchestration operation and observes native child argument and exit delivery.
 * @evidence contracts/e2e.md#necessary-boundary Actual Node processes prove that later commands execute after failure and receive the intended environment; a status reducer alone cannot establish invocation or propagation.
 * @evidence contracts/e2e.md#shared-execution One fixture launcher and temporary root serve all permutations with no installations or native builds; separate command exits are the boundary being checked.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each permutation resets its status map and execution log; synchronous children finish before the fixture is removed in finally, and no shared package artifacts are changed.
 * @evidence contracts/e2e.md#preserved-coverage This pins suite continuation, failure aggregation, build dependency and cache propagation alongside existing Evidence runner coverage; product boundary assertions remain in their respective suites.
 */
export const test_e2e_runner_collects_failures = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-e2e-runner-"));
  const launcher = path.join(root, "launcher.cjs");
  const log = path.join(root, "commands.jsonl");
  const status = path.join(root, "status.json");
  const expected = [
    ["--filter", "./tests/test-boundaries", "--filter", "./tests/test-evidence", "--filter", "./tests/test-benchmark-e2e", "--filter", "./tests/test-migrate-e2e", "--filter", "./tests/test-core-e2e", "-r", "--parallel", "--no-bail", "run", "start"],
    ["--filter", "./tests/test-sdk-e2e", "start"],
    ["--filter", "./benchmark", "build"],
    ["--filter", "./benchmark", "test"],
  ];
  try {
    fs.writeFileSync(launcher, `const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args,
  cache: process.env.TTSC_CACHE_DIR,
  reuse: process.env.TEST_SDK_SKIP_BUILD ?? null }) + "\\n");
const status = JSON.parse(fs.readFileSync(${JSON.stringify(status)}, "utf8"));
process.exitCode = status[args.join(" ")] ?? 0;
`);
    for (const [statuses, code, count] of [
      [{}, 0, 4],
      [{ [expected[0].join(" ")]: 1 }, 1, 4],
      [{ [expected[2].join(" ")]: 1 }, 1, 3],
    ]) {
      fs.writeFileSync(status, JSON.stringify(statuses));
      fs.writeFileSync(log, "");
      assert.equal(runE2E(root, launcher), code);
      const executions = fs.readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
      assert.deepEqual(executions.map(entry => entry.args), expected.slice(0, count));
      for (const entry of executions) {
        assert.equal(entry.cache, path.join(root, "node_modules/.cache/ttsc"));
        if (entry.args[1] === "./tests/test-sdk-e2e") assert.equal(entry.reuse, "1");
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("E2E runner collects failures", test_e2e_runner_collects_failures);
