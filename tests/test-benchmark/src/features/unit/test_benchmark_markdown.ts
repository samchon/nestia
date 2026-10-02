import assert from "node:assert/strict";
import path from "node:path";

import type { DynamicBenchmarker } from "../../../../../packages/benchmark/lib";

/**
 * Verifies report formatting with authored measurements and supplied host
 * facts.
 *
 * Direct rendering exposes absent CPU data and decimal formatting without
 * replacing os functions or Number methods in the shared test process.
 *
 * 1. Render a report with positive, negative and absent duration measures.
 * 2. Assert literal table values, host fallback and preservation of endpoint
 *    order.
 *
 * @evidence contracts/testing.md#behavioral-verification The built reporter renders actual authored statistics with supplied host facts. Literal CPU/RAM and decimal table values, absence of unconfigured backend information and unchanged report data distinguish formatting and mutation defects.
 * @evidence contracts/testing.md#independent-expectations Count separators, decimal truncation, N/A for absent duration and unknown for absent CPU are independent report-display contracts. Authored measurements and host facts provide the oracle.
 * @evidence contracts/testing.md#distinguishing-cases Positive and negative decimals contrast absent duration; absent CPU contrasts present memory/Node facts. The input clone detects report mutation and original endpoint order is retained.
 * @evidence contracts/testing.md#execution-ownership The benchmark unit entry discovers this matching function and calls the caller-built reporter directly. It creates no server, worker, installation or native compiler context.
 */
export const test_benchmark_markdown = (): void => {
  const { DynamicBenchmarkReporter } = require(
    path.resolve(
      __dirname,
      "../../../../../packages/benchmark/lib/internal/DynamicBenchmarkReporter.js",
    ),
  ) as typeof import("../../../../../packages/benchmark/lib/internal/DynamicBenchmarkReporter");
  const report: DynamicBenchmarker.IReport = {
    count: 12_345,
    threads: 4,
    simultaneous: 16,
    statistics: {
      count: 12_345,
      success: 12_000,
      mean: 1_234.567,
      stdev: 12.5,
      minimum: -1.239,
      maximum: null,
    },
    endpoints: [
      {
        method: "GET",
        path: "/slow",
        count: 1,
        success: 0,
        mean: 8,
        stdev: 0,
        minimum: 8,
        maximum: 8,
      },
      {
        method: "GET",
        path: "/fast",
        count: 1,
        success: 1,
        mean: 2,
        stdev: 0,
        minimum: 2,
        maximum: 2,
      },
    ],
    started_at: new Date(0).toISOString(),
    completed_at: new Date(1_234_567).toISOString(),
    memories: [],
  };
  const original = structuredClone(report);
  const markdown = DynamicBenchmarkReporter.markdown(report, {
    cpu: undefined,
    memory: 8 * 1024 ** 3,
    node: "v24.0.0",
  });
  assert.ok(markdown.includes("CPU: unknown"));
  assert.ok(markdown.includes("RAM: 8 GB"));
  assert.ok(
    markdown.includes(
      "Total | 12,345 | 12,000 | 1,234.56 | 12.5 | -1.23 | N/A",
    ),
  );
  assert.ok(markdown.includes("GET | /slow | 1 | 1"));
  assert.ok(!markdown.includes("Backend Server"));
  assert.deepEqual(report, original);
};
