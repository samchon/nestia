import assert from "node:assert/strict";
import cp from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Verifies masters release servants and preserve completed memory reports.
 *
 * A rejected worker operation must settle the master and allow its process to
 * exit naturally. An explicit process.exit would hide retained worker handles
 * or a sampler that keeps scheduling timers after the benchmark ends.
 *
 * 1. Open real TGrid servants and complete an empty control execution.
 * 2. Open the same servants with an operation that rejects over RPC.
 * 3. Retain an active getter result, tolerate getter rejection and discard a held
 *    result fulfilled after the report returns.
 * 4. Require the original error, stopped sampling and natural child exit.
 *
 * @evidence contracts/testing.md#behavioral-verification A real master child checks success and original RPC rejection, no new getter calls after completion, exact retained caller data while active and an unchanged returned report after fulfilling a held getter. Getter rejection must not reject the benchmark; natural child exit catches retained worker handles.
 * @evidence contracts/testing.md#independent-expectations The servant returns an empty event list or throws a literal error. Handwritten getter data belongs in an active report, while a completed report is a settled observation and must not acquire later samples. These expectations do not use the statistics implementation.
 * @evidence contracts/testing.md#distinguishing-cases Immediate success and RPC rejection retain two-servant fan-out. Gated executions distinguish an active fulfilled getter, a rejected getter and one still pending at completion; only the active successful data may be recorded. Connection-handshake failure is outside this scenario.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this case in the shared test-boundaries process; its child loads built benchmark and TGrid modules under plain Node.
 * @evidence contracts/e2e.md#necessary-boundary Real process workers and RPC rejection expose leaked child handles and sampler timers; direct statistics or mocked connectors cannot establish natural process termination.
 * @evidence contracts/e2e.md#shared-execution One temporary fixture and installed build serve all five modes in one master child. Each mode opens its own servants because release after that mode is the transition under test; no package installation or compilation occurs per mode.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture is unique; sequential masters reset the getter gate and callback state. The parent bounds the child to twenty-five seconds and removes only its files after that child ends. Production cleanup releases servants and every held getter is fulfilled after the report settles.
 * @evidence contracts/e2e.md#preserved-coverage Successful and rejected-RPC cleanup controls remain; active, rejected and pending getter transitions add the regression for completed-report mutation. HTTP workload counts, concurrency and filtering remain in their transport owner.
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
  const gate = path.join(root, "getter-started");
  try {
    fs.writeFileSync(
      servant,
      `const fs = require("node:fs");
const { WorkerServer } = require(${JSON.stringify(tgrid)});
new WorkerServer().open({
  execute: async () => {
    if (process.env.CLEANUP_MODE === "failure")
      throw new Error("cleanup RPC failure");
    if (["sampled", "getter-reject", "pending"].includes(process.env.CLEANUP_MODE)) {
      const deadline = Date.now() + 5000;
      while (!fs.existsSync(${JSON.stringify(gate)})) {
        if (Date.now() > deadline) throw new Error("memory getter never started");
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    return [];
  },
}).catch(error => { console.error(error); process.exitCode = 1; });
`,
    );
    fs.writeFileSync(
      master,
      `const assert = require("node:assert/strict");
const fs = require("node:fs");
const { DynamicBenchmarker } = require(${JSON.stringify(benchmark)});
async function main() {
  const usage = { rss: 101, heapTotal: 102, heapUsed: 103, external: 104, arrayBuffers: 105 };
  for (const mode of ["success", "failure", "sampled", "getter-reject", "pending"]) {
    process.env.CLEANUP_MODE = mode;
    fs.rmSync(${JSON.stringify(gate)}, { force: true });
    let samples = 0;
    let release;
    const execution = DynamicBenchmarker.master({
      servant: ${JSON.stringify(servant)},
      count: 2, threads: 2, simultaneous: 2, stdio: "ignore",
      memory: () => {
        ++samples;
        fs.writeFileSync(${JSON.stringify(gate)}, "started");
        if (mode === "getter-reject") return Promise.reject(new Error("sampling refused"));
        if (mode === "pending") return new Promise(resolve => { release = () => resolve(usage); });
        return Promise.resolve(usage);
      },
    });
    if (mode === "failure")
      await assert.rejects(execution, { message: "cleanup RPC failure" });
    else {
      const report = await execution;
      assert.equal(report.statistics.count, 0);
      if (mode === "sampled") {
        assert.ok(report.memories.length > 0, "active sample was discarded");
        for (const sample of report.memories) assert.strictEqual(sample.usage, usage);
      } else if (mode === "getter-reject" || mode === "pending") {
        assert.equal(samples, 1, "gated execution did not invoke the getter");
        assert.deepEqual(report.memories, []);
        if (mode === "pending") {
          const completed = JSON.stringify(report);
          assert.equal(typeof release, "function");
          release();
          await new Promise(resolve => setImmediate(resolve));
          assert.equal(JSON.stringify(report), completed, "pending getter mutated completed report");
        }
      }
    }
    const completedSamples = samples;
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(samples, completedSamples, mode + " sampler remained active");
    console.log(mode + " cleanup control passed");
  }
  console.log("cleanup complete");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
`,
    );
    const result = cp.spawnSync(process.execPath, [master], {
      encoding: "utf8",
      timeout: 25_000,
      windowsHide: true,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /cleanup complete/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
