import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runE2E } from "../../../../../scripts/run-e2e.cjs";

/**
 * Verifies the sole E2E launcher propagates the actual child result.
 *
 * A successful launch cannot hide an entry failure or signal. The fixture
 * observes delivered arguments and cache environment through real children.
 *
 * 1. Execute successful, nonzero and signalled children with fresh logs.
 * 2. Require exactly one canonical workspace invocation for every outcome.
 * 3. Reject a missing launcher without invoking a consumer.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual runE2E operation launches real Node children; literal child outcomes must produce 0 only for success and 1 for nonzero, signal and missing launcher.
 * @evidence contracts/testing.md#independent-expectations Authored child exit values and a self-sent termination signal establish failure independently of runner reduction. The recorded argv establishes the single integrated entry and cache delivery.
 * @evidence contracts/testing.md#distinguishing-cases Success, exit 2, termination and absent launcher distinguish successful completion, entry failure, process termination and inability to launch. Logs require exactly one execution each.
 * @evidence contracts/testing.md#execution-ownership Node's test runner discovers this export in the sole test-e2e process batch. It invokes real child processes without installing dependencies or starting product hosts.
 * @evidence contracts/e2e.md#necessary-boundary Real Node argv, environment, exit and signal delivery establish behavior that a pure status reducer cannot prove.
 * @evidence contracts/e2e.md#shared-execution One fixture launcher and temporary root serve all outcomes; each child lifetime is the process boundary being tested, with no product compilation or installation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each permutation truncates its observation log and children settle synchronously before finally removes the uniquely owned root.
 * @evidence contracts/e2e.md#preserved-coverage Single-child failure and cache propagation replace the obsolete independent-suite scheduling assertions. The old parallel dispatcher contract belongs to pnpm and is no longer a connection the repository uses.
 */
export const test_e2e_runner_propagates_result = () => {
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, "nestia-e2e-runner-"));
  const launcher = path.join(root, "launcher.cjs");
  const log = path.join(root, "commands.jsonl");
  const outcome = path.join(root, "outcome.json");
  try {
    fs.writeFileSync(launcher, `const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({args: process.argv.slice(2), cache: process.env.TTSC_CACHE_DIR, goCache: process.env.GOCACHE}) + "\\n");
const outcome = JSON.parse(fs.readFileSync(${JSON.stringify(outcome)}, "utf8"));
if (outcome === "signal") process.kill(process.pid, "SIGTERM");
else process.exitCode = outcome;
`);
    for (const value of [0, 2, "signal"]) {
      fs.writeFileSync(log, "");
      fs.writeFileSync(outcome, JSON.stringify(value));
      assert.equal(runE2E(root, launcher), value === 0 ? 0 : 1);
      const executions = fs.readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
      assert.deepEqual(executions, [{
        args: ["--filter", "./tests/test-e2e", "start"],
        cache: path.join(root, "node_modules/.cache/ttsc"),
        goCache: path.join(root, "node_modules/.cache/ttsc/go-build"),
      }]);
    }
    assert.equal(runE2E(root, ""), 1);
  } finally {
    assert.equal(path.dirname(root), base);
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("Sole E2E runner propagates result", test_e2e_runner_propagates_result);
