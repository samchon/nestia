import api from "../api";

/**
 * Supplies one HTTP event for each benchmark invocation.
 *
 * The suite counts events and endpoint groups against a known one-event
 * workload while measuring the simultaneous request ceiling at the server.
 *
 * 1. Invoke the paginated endpoint once with the servant's logging connection.
 * 2. Let the suite assert thirty events, endpoint totals and the four-request
 *    limit.
 *
 * @evidence contracts/testing.md#behavioral-verification The suite runs this function thirty times and asserts event count, endpoint totals, invocation progress and observed HTTP concurrency.
 * @evidence contracts/testing.md#independent-expectations One awaited request per invocation independently requires thirty events for count thirty; concurrent function budgets sum to the configured simultaneous four.
 * @evidence contracts/testing.md#distinguishing-cases This one-event workload is the positive control for the two-events-per-invocation feature; suite index also rejects simultaneous two with threads four.
 * @evidence contracts/testing.md#execution-ownership A process-mode servant invokes this feature against the suite's live Nest application; suite index.ts owns the observable assertions.
 * @evidence contracts/e2e.md#necessary-boundary Real worker RPC, generated fetch logging and HTTP arrival concurrency must preserve the master's distribution; direct statistics calls cannot prove those connections.
 * @evidence contracts/e2e.md#shared-execution The suite starts one backend for both benchmark workloads; each master owns its own servants and both consume the same feature program without separate installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The endpoint produces stateless random response data; suite counters observe in-flight requests, the master closes servants and the suite finally closes the application.
 * @evidence contracts/e2e.md#preserved-coverage Existing count, endpoint grouping, maximum concurrency, progress and invalid-budget assertions remain in the suite entry; removed BBS sample functions were never selected by its file filter.
 */
export async function test_api_count(
  connection: api.IConnection,
): Promise<void> {
  await api.functional.bbs.articles.index(connection, "general", {
    limit: 1,
  });
}
