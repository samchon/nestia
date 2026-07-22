import assert from "node:assert/strict";
import os from "os";

import { BenchmarkServer } from "./internal/BenchmarkServer";
import { BenchmarkWorker } from "./internal/BenchmarkWorker";

/**
 * Verifies benchmark worker selection stays runnable on constrained and WMIC-free hosts.
 *
 * Why:
 * The runner must load before it can select autocannon workers, even when the legacy
 * Windows CPU command no longer exists.
 *
 * 1. Loads the runner's measurement bootstrap without beginning a benchmark.
 * 2. Maps constrained hosts safely and falls back to Node when the legacy probe fails.
 */
const test = (): void => {
  assert.ok(BenchmarkServer);
  assert.equal(BenchmarkWorker.workers(1), 0);
  assert.equal(BenchmarkWorker.workers(2), 0);
  assert.equal(BenchmarkWorker.workers(3), 1);
  assert.equal(BenchmarkWorker.workers(8), 2);
  assert.ok(BenchmarkWorker.physicalCpuCount() > 0);
  assert.equal(
    BenchmarkWorker.physicalCpuCount(() => {
      throw new Error("WMIC is unavailable");
    }),
    os.availableParallelism(),
  );
};
test();
