import api from "../../api";

/**
 * Supplies one event per invocation through the shared generated health client.
 *
 * The worker-budget assertions need successful logged requests, independently
 * of the former paginated fixture's unasserted random response payload.
 *
 * 1. Execute the workload's original number of awaited client calls.
 * 2. The master verifies thirty events, endpoint totals, progress and the
 *    four-slot ceiling.
 *
 * @evidence contracts/testing.md#behavioral-verification The workload emits one event per invocation through the actual servant logging connection; the discoverable master case verifies the total and progress distinction.
 * @evidence contracts/testing.md#independent-expectations Thirty awaited generated-client calls supply thirty events.
 * @evidence contracts/testing.md#distinguishing-cases The single- and two-event workloads distinguish request events from completed function invocations. Direct units own arithmetic, reports and invalid budgets.
 * @evidence contracts/testing.md#execution-ownership The compiled servant discovers this matching export under benchmark/features; the SDK shared HTTP entry discovers the master assertions over real workers and transport.
 * @evidence contracts/e2e.md#necessary-boundary The generated client must log real HTTP events that the servant transports over actual IPC to the master; direct statistics units cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution The existing app and generated client serve this workload; the worker and both workload files join the one consumer compilation before sessions start.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each worker has its own logging connection; health requests are stateless and awaited. The master closes its workers before the runner closes the shared app.
 * @evidence contracts/e2e.md#preserved-coverage The original awaited call count and master assertions survive; the existing health endpoint replaces the unnecessary pagination/random-response fixture, whose response shape this workload never asserted.
 */
export async function test_api_count(
  connection: api.IConnection,
): Promise<void> {
  await api.functional.body_rich.normal.health.get(connection);
}
