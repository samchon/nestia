const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const cp = require("node:child_process");

/**
 * Verifies worker budgets, filtered imports and HTTP aggregation in one run.
 *
 * Server response-close observations provide a concurrency oracle separate
 * from the master's returned events. Three workers divide four request slots.
 *
 * 1. Reset the common backend's scoped benchmark observation.
 * 2. Execute thirty generated PATCH calls over three real servants.
 * 3. Assert report, progress, filter, success and independently observed limits.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual installed DynamicBenchmarker master/servant RPC and generated HTTP calls must produce exactly thirty successful events, PATCH-only endpoint totals, bounded final progress and at most four independently observed requests in flight.
 * @evidence contracts/testing.md#independent-expectations Thirty and four are caller budgets; the stateless controller returns one. Response-close middleware observes actual server work independently of benchmark aggregation.
 * @evidence contracts/testing.md#distinguishing-cases Non-divisible four-over-three budgets expose rounded-up allocations. A rejected throwing module exposes filter-before-import defects; positive successful requests distinguish mere failure-event counts.
 * @evidence contracts/testing.md#execution-ownership The sole installed E2E entry invokes this export after consumer compilation while its common backend remains open. This is real worker and HTTP integration.
 * @evidence contracts/e2e.md#necessary-boundary Generated request logging, worker RPC, budget fan-out and server concurrency cannot be proved through isolated statistics calculations.
 * @evidence contracts/e2e.md#shared-execution One master run shares the existing installation, producer, generated consumer and backend. Its three real servants are required to distinguish non-divisible allocations.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The monitor resets only without outstanding benchmark responses; the route is stateless. The worker host environment is restored in finally, and master owns servant closure before backend teardown.
 * @evidence contracts/e2e.md#preserved-coverage Original count, endpoint totals, PATCH filter, final/bounded progress and response-close peak assertions remain; the import-negative and successful-event assertions strengthen their controls. Original files remain until the executable transfer gate succeeds.
 */
const test_benchmark_http_connection = async ({ sandbox, host, installation }) => {
  const { DynamicBenchmarker } = require(require.resolve("@nestia/benchmark", {
    paths: [installation.directory],
  }));
  const monitor = require(path.join(sandbox, ".producer/benchmark/BenchmarkMonitor.js"));
  monitor.resetBenchmarkMonitor();
  const previous = process.env.NESTIA_BENCHMARK_HOST;
  process.env.NESTIA_BENCHMARK_HOST = host;
  try {
    const progress = [];
    const report = await DynamicBenchmarker.master({
      servant: path.join(sandbox, ".consumer/consumer/src/benchmark/servant.js"),
      count: 30,
      threads: 3,
      simultaneous: 4,
      stdio: "ignore",
      filter: (file) => file === "test_api_count.js",
      progress: (count) => progress.push(count),
    });
    assert.equal(report.statistics.count, 30);
    assert.equal(report.statistics.success, 30);
    assert.equal(report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0), 30);
    assert.ok(report.endpoints.every((endpoint) => endpoint.method === "PATCH"));
    assert.ok(progress.every((count) => count <= 30));
    assert.equal(progress.at(-1), 30);
    const observed = monitor.readBenchmarkMonitor();
    assert.equal(observed.requests, 30);
    assert.ok(observed.peak > 0 && observed.peak <= 4, JSON.stringify(observed));
    console.log(" - benchmark HTTP budget/filter/progress: passed");
  } finally {
    if (previous === undefined) delete process.env.NESTIA_BENCHMARK_HOST;
    else process.env.NESTIA_BENCHMARK_HOST = previous;
  }
};

module.exports = { test_benchmark_http_connection };
