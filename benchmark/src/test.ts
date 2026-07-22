import assert from "node:assert/strict";
import os from "os";

import { BenchmarkWorker } from "./internal/BenchmarkWorker";

/**
 * Verifies benchmark worker selection stays runnable on constrained and WMIC-free hosts.
 *
 * - Maps one- and two-processor hosts to autocannon's single-process mode.
 * - Falls back to Node's available processor count when the legacy probe is unavailable.
 */
const test = (): void => {
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
