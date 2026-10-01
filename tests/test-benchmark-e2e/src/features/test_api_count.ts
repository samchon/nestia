import api from "../api";

/**
 * The workload of the benchmark run: one request to the article list route.
 *
 * The servants call it 30 times, and the suite asserts the report's totals.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `api.functional.bbs.articles.index` with `limit: 1`; the suite asserts that the benchmark executed exactly 30 of it, that the endpoint totals add up to 30, that progress never exceeds 30, and that at most 4 ran at once.
 * @evidence contracts/testing.md#independent-expectations The expected count is the `count: 30` the master was given, and the ceiling is `simultaneous: 4`; both are inputs of the run, not values read from the report.
 * @evidence contracts/testing.md#distinguishing-cases One selected feature against the unselected `test_api_bbs_article_create` separates a filter that runs every feature from one that runs the chosen file; a run refused for `simultaneous < threads` is owned by the unit test `test_benchmark_master_arguments`.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-benchmark-e2e` suite) under `DynamicBenchmarker.master()`, which starts servant worker processes with `ttsx` against a real NestJS server on port 3000; the suite entry `src/index.ts` owns the run and the servants discover this function by the `test_api_` prefix under `src/features`.
 * @evidence contracts/e2e.md#necessary-boundary The failures that direct calls cannot detect are in the process protocol: servants that never start, budgets that sum to more than `simultaneous`, a progress callback that overshoots, and a report whose totals disagree with the count. They need real `ttsx` worker processes talking to a real server.
 * @evidence contracts/e2e.md#shared-execution The suite runs `master()` once, with one server and three servant processes, and every assertion of the suite reads that one report: count, endpoint totals, filter, progress, and the peak of requests in flight; no assertion needs a second run, so the servant startup is paid once.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The server is created and closed by the suite in a `finally`, on a port the suite owns, and the servants are children of the run that end with it; the only file the run writes is the git-ignored `BENCHMARK.md`, so no earlier run determines a later result.
 * @evidence contracts/e2e.md#preserved-coverage The four workload features that were never selected by the run's filter ran no assertion in any suite, and were removed with their dead code; the report formatting and the argument check moved to `test-benchmark` as `test_benchmark_markdown` and `test_benchmark_master_arguments`, and the statistics are covered by `test_benchmark_statistics`.
 */
export async function test_api_count(
  connection: api.IConnection,
): Promise<void> {
  await api.functional.bbs.articles.index(connection, "general", {
    limit: 1,
  });
}
