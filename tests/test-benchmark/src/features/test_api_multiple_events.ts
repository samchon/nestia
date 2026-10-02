import api from "../api";

/**
 * Supplies two HTTP events for one benchmark function invocation.
 *
 * The master must count completed invocations for progress while retaining both
 * request events for endpoint and duration statistics.
 *
 * 1. Invoke the same endpoint twice with the servant's logging connection.
 * 2. Let the suite entry assert event totals and progress independently.
 *
 * @evidence contracts/testing.md#behavioral-verification The connected benchmark suite runs this function six times and asserts twelve events but progress bounded by six completed invocations.
 * @evidence contracts/testing.md#independent-expectations Two awaited HTTP requests per invocation independently require twelve logged events for six invocations; the configured invocation count bounds progress.
 * @evidence contracts/testing.md#distinguishing-cases The existing single-event count feature is the adjacent control; this feature distinguishes function completion from the number of events its logger records.
 * @evidence contracts/testing.md#execution-ownership A real worker invokes this feature against the suite's HTTP application; suite index.ts owns count, endpoint and progress assertions.
 * @evidence contracts/e2e.md#necessary-boundary Actual servant RPC and fetch logging must agree on invocation progress and event collection, which a direct renderer or statistics call cannot establish.
 * @evidence contracts/e2e.md#shared-execution Reuses the same already-started application and servant program as the single-event benchmark; a second master request selects this different feature without reinstalling or compiling products.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Both requests read the stateless random-response endpoint; this run has its own progress array and workers, which master closes, while the suite finally closes the shared application.
 * @evidence contracts/e2e.md#preserved-coverage The original single-event total, endpoint grouping, concurrency and invalid-budget assertions remain in index.ts; the added run owns the previously absent multiple-events-per-invocation distinction.
 */
export const test_api_multiple_events = async (
  connection: api.IConnection,
): Promise<void> => {
  for (let i = 0; i < 2; ++i)
    await api.functional.bbs.articles.index(connection, "general", {
      limit: 1,
    });
};
