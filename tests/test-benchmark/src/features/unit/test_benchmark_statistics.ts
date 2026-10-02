import assert from "node:assert/strict";
import path from "node:path";

import type { IBenchmarkEvent } from "../../../../../packages/benchmark/lib";

/**
 * Verifies population statistics over independently authored event durations.
 *
 * Empty and constant populations distinguish absent measurements from zero
 * deviation; mixed success flags must not change the duration population.
 *
 * 1. Summarize empty, singleton, mixed and constant event populations.
 * 2. Compare every count and elapsed measure with literal mathematical
 *    expectations.
 *
 * @evidence contracts/testing.md#behavioral-verification The built statistics operation computes count, success, mean, population deviation and extrema from authored events. Empty and constant populations must distinguish absent values from measured zero deviation.
 * @evidence contracts/testing.md#independent-expectations Literal results follow elementary population arithmetic: durations1/3 have mean2 and deviation1; singleton/constant populations have deviation0. Timestamp-derived event durations are independently authored.
 * @evidence contracts/testing.md#distinguishing-cases Empty, singleton, mixed-success and large constant populations retain every original count and elapsed-measure assertion, including null extrema and successful-event counts independent of duration membership.
 * @evidence contracts/testing.md#execution-ownership The benchmark unit entry discovers this matching function and calls the caller-built statistics operation directly. No application, HTTP request, worker, consumer installation or native artifact is prepared.
 */
export const test_benchmark_statistics = (): void => {
  const { DynamicBenchmarkStatistics } = require(
    path.resolve(
      __dirname,
      "../../../../../packages/benchmark/lib/internal/DynamicBenchmarkStatistics.js",
    ),
  ) as typeof import("../../../../../packages/benchmark/lib/internal/DynamicBenchmarkStatistics");
  const event = (duration: number, success = true): IBenchmarkEvent => ({
    metadata: {
      method: "GET",
      path: "/sample",
      request: null,
      response: { type: "application/json" },
      status: 200,
    },
    status: 200,
    started_at: new Date(0).toISOString(),
    respond_at: null,
    completed_at: new Date(duration).toISOString(),
    success,
  });
  assert.deepEqual(DynamicBenchmarkStatistics.of([]), {
    count: 0,
    success: 0,
    mean: null,
    stdev: null,
    minimum: null,
    maximum: null,
  });
  assert.deepEqual(DynamicBenchmarkStatistics.of([event(3)]), {
    count: 1,
    success: 1,
    mean: 3,
    stdev: 0,
    minimum: 3,
    maximum: 3,
  });
  assert.deepEqual(DynamicBenchmarkStatistics.of([event(1), event(3, false)]), {
    count: 2,
    success: 1,
    mean: 2,
    stdev: 1,
    minimum: 1,
    maximum: 3,
  });
  assert.deepEqual(
    DynamicBenchmarkStatistics.of([
      event(100_000_001),
      event(100_000_001),
      event(100_000_001),
    ]),
    {
      count: 3,
      success: 3,
      mean: 100_000_001,
      stdev: 0,
      minimum: 100_000_001,
      maximum: 100_000_001,
    },
  );
};
