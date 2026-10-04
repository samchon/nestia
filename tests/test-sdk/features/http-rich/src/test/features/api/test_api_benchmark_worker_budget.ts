import { DynamicBenchmarker } from "@nestia/benchmark";
import fs from "node:fs";
import path from "node:path";

import type api from "../../../api";

/**
 * Verifies real worker request budgets and invocation-based progress.
 *
 * Worker allocation must sum to the concurrency budget, and a two-event
 * function must not count twice toward completed invocations. Server middleware
 * observes outstanding requests independently of worker reporting.
 *
 * 1. Run thirty one-event invocations across three workers and four slots.
 * 2. Check event and endpoint totals, final progress and observed concurrency.
 * 3. Run six two-event invocations across two workers and two slots, requiring
 *    twelve events and monotonic invocation progress ending at six.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual master/servant sessions must report thirty single-event requests with peak at most four, then twelve events from six two-event invocations with monotonic invocation progress.
 * @evidence contracts/testing.md#independent-expectations Literal counts and one-/two-event workload loops establish totals; server middleware observes actual outstanding requests rather than trusting reported worker budgets.
 * @evidence contracts/testing.md#distinguishing-cases Three workers share four slots without upward rounding; two-event invocations distinguish event totals from invocation progress. Observed peak must be nonzero, preventing absent instrumentation from passing the ceiling. Units own invalid budget rejection.
 * @evidence contracts/testing.md#execution-ownership The SDK shared HTTP entry discovers this matching file/export and supplies the connection and observer; compiled workers discover two separately documented workloads.
 * @evidence contracts/e2e.md#necessary-boundary Real IPC, generated-client event logging, live concurrency and master progress must agree; direct reporter/statistics/option units cannot establish these connections.
 * @evidence contracts/e2e.md#shared-execution The existing HTTP app and generated SDK serve both sessions. Worker and workload files join the single consumer compilation; the case starts only its necessary three- and two-worker sessions.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Serial case execution gives this case exclusive observer ownership. The host environment is restored in finally; master owns worker closure and the runner closes its app after all cases.
 * @evidence contracts/e2e.md#preserved-coverage Every original thirty-count/endpoint/progress/peak and six-invocation/twelve-event/monotonic-progress assertion from test-benchmark/src/index.ts executes here; original report rendering remains and direct unit assertions stay in test-benchmark.
 */
export async function test_api_benchmark_worker_budget(
  connection: api.IConnection,
  traffic: { active: boolean; inFlight: number; peak: number },
): Promise<void> {
  const oldHost = process.env.TEST_BENCHMARK_HOST;
  process.env.TEST_BENCHMARK_HOST = connection.host;
  traffic.active = true;
  traffic.inFlight = 0;
  traffic.peak = 0;
  const extension = __filename.substring(__filename.lastIndexOf(".") + 1);
  const servant = path.resolve(
    __dirname,
    `../../../benchmark/servant.${extension}`,
  );
  try {
    const progresses: number[] = [];
    const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
      servant: servant,
      count: 30,
      threads: 3,
      simultaneous: 4,
      stdio: "ignore",
      filter: (file) => file === `test_api_count.${extension}`,
      progress: (current) => progresses.push(current),
    });
    if (report.statistics.count !== 30)
      throw new Error(
        `DynamicBenchmarker executed ${report.statistics.count} requests for a count of 30.`,
      );
    if (report.statistics.success !== 30)
      throw new Error("The thirty benchmark requests must all succeed.");
    if (
      report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !== 30
    )
      throw new Error("DynamicBenchmarker endpoint totals do not match count.");
    if (
      progresses.some((current) => current > 30) ||
      progresses[progresses.length - 1] !== 30
    )
      throw new Error(
        "DynamicBenchmarker progress exceeds the requested count.",
      );
    // The servants' budgets sum to `simultaneous`: rounding each servant's
    // share up ran 2 + 2 + 2 requests at once for a configured 4 (#1682).
    if (traffic.peak <= 0 || traffic.peak > 4)
      throw new Error(
        `DynamicBenchmarker ran ${traffic.peak} requests at once for simultaneous 4.`,
      );
    const multipleProgresses: number[] = [];
    const multiple = await DynamicBenchmarker.master({
      servant: servant,
      count: 6,
      threads: 2,
      simultaneous: 2,
      stdio: "ignore",
      filter: (file) => file === `test_api_multiple_events.${extension}`,
      progress: (current) => multipleProgresses.push(current),
    });
    if (
      multiple.statistics.count !== 12 ||
      multiple.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !==
        12
    )
      throw new Error(
        "Two requests per invocation must produce twelve events.",
      );
    if (multiple.statistics.success !== 12)
      throw new Error("The twelve benchmark request events must all succeed.");
    if (
      multipleProgresses.some(
        (current, index) =>
          current > 6 ||
          (index !== 0 && current < multipleProgresses[index - 1]!),
      ) ||
      multipleProgresses.at(-1) !== 6
    )
      throw new Error(
        "Progress must count invocations, independently of event count.",
      );
    await fs.promises.writeFile(
      path.resolve(__dirname, "../../../../BENCHMARK.md"),
      DynamicBenchmarker.markdown(report),
      "utf8",
    );
  } finally {
    traffic.active = false;
    if (oldHost === undefined) delete process.env.TEST_BENCHMARK_HOST;
    else process.env.TEST_BENCHMARK_HOST = oldHost;
  }
}
