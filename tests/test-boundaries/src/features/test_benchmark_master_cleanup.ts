import assert from "node:assert/strict";
import cp from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Verifies benchmark masters release servants and sampling after RPC failure.
 *
 * A rejected worker operation must settle the master and allow its process to
 * exit naturally. An explicit process.exit would hide retained worker handles
 * or a sampler that keeps scheduling timers after the benchmark ends.
 *
 * 1. Open real TGrid servants and complete an empty control execution.
 * 2. Open the same servants with an operation that rejects over RPC.
 * 3. Require the original error, stopped sampling and natural child exit.
 *
 * @evidence contracts/testing.md#behavioral-verification A real master child runs success and rejected RPC executions, checks the empty report and original rejection, and asserts its memory getter receives no new calls after completion; the parent requires natural exit before its timeout.
 * @evidence contracts/testing.md#independent-expectations The control servant returns an empty event list and the failing servant throws a literal error; completed execution must stop background sampling and release process handles, independently of the master's statistics computation.
 * @evidence contracts/testing.md#distinguishing-cases Successful empty execution and failed RPC share two-servant fan-out; both must stop sampling, and failure must preserve its error. Connection-handshake failures are outside this scenario.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this case in the shared test-boundaries process; its child loads built benchmark and TGrid modules under plain Node.
 * @evidence contracts/e2e.md#necessary-boundary Real process workers and RPC rejection expose leaked child handles and sampler timers; direct statistics or mocked connectors cannot establish natural process termination.
 * @evidence contracts/e2e.md#shared-execution One temporary fixture and installed build serve both modes in one master child. Each mode opens its own servants because release after that mode is the transition under test; no package installation or compilation occurs per mode.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture is unique, modes use sequential master lifetimes, the parent bounds the child to fifteen seconds and finally removes only its owned files after the child has ended. Servants use the master's production cleanup.
 * @evidence contracts/e2e.md#preserved-coverage This adds failure cleanup and a successful control beside the HTTP workload's count, concurrency and filtering assertions; it does not replace the existing transport benchmark.
 */
export const test_benchmark_master_cleanup = (): void => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-master-cleanup-"));
  const benchmark = path.resolve(
    process.cwd(),
    "../../packages/benchmark/lib/DynamicBenchmarker.js",
  );
  const tgrid = require.resolve("tgrid", {
    paths: [path.dirname(benchmark)],
  });
  const servant = path.join(root, "servant.cjs");
  const master = path.join(root, "master.cjs");
  try {
    fs.writeFileSync(
      servant,
      `const { WorkerServer } = require(${JSON.stringify(tgrid)});
new WorkerServer().open({
  execute: async () => {
    if (process.env.CLEANUP_MODE === "failure")
      throw new Error("cleanup RPC failure");
    return [];
  },
}).catch(error => { console.error(error); process.exitCode = 1; });
`,
    );
    fs.writeFileSync(
      master,
      `const assert = require("node:assert/strict");
const { DynamicBenchmarker } = require(${JSON.stringify(benchmark)});
async function main() {
  for (const mode of ["success", "failure"]) {
    process.env.CLEANUP_MODE = mode;
    let samples = 0;
    const execution = DynamicBenchmarker.master({
      servant: ${JSON.stringify(servant)},
      count: 2, threads: 2, simultaneous: 2, stdio: "ignore",
      memory: async () => { ++samples; return process.memoryUsage(); },
    });
    if (mode === "failure")
      await assert.rejects(execution, { message: "cleanup RPC failure" });
    else
      assert.equal((await execution).statistics.count, 0);
    const completedSamples = samples;
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(samples, completedSamples, mode + " sampler remained active");
  }
  console.log("cleanup complete");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
`,
    );
    const result = cp.spawnSync(process.execPath, [master], {
      encoding: "utf8",
      timeout: 15_000,
      windowsHide: true,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /cleanup complete/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
