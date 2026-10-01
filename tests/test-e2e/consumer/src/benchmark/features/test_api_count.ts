import api from "../../api";

/**
 * Verifies a generated PATCH contributes one event to the shared workload.
 *
 * The master budget and server observations detect scheduling errors outside
 * this feature; checking the literal result also separates successful delivery
 * from an event logged for a failed request.
 *
 * 1. Call the generated benchmark PATCH with the worker's logging connection.
 * 2. Require the controller's authored literal response.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated client sends the actual PATCH and rejects any response other than the authored number one; the master additionally asserts thirty successful logged events.
 * @evidence contracts/testing.md#independent-expectations The handwritten controller returns one; the caller budget specifies thirty executions independently of report aggregation.
 * @evidence contracts/testing.md#distinguishing-cases The selected PATCH is paired with a rejected throwing-import feature; report count, progress and server concurrency assertions belong to the installed batch.
 * @evidence contracts/testing.md#execution-ownership The real benchmark servant discovers this function in the compiled consumer's benchmark/features directory; the ordinary request executor does not discover it.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated-client logging and HTTP transport must deliver the endpoint event back across worker RPC to the master.
 * @evidence contracts/e2e.md#shared-execution The feature shares the sole installation, producer, generated consumer and backend, and the master's three workers execute all thirty calls.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A dedicated stateless route and fresh per-request logging connection isolate events; the master closes workers before the backend owner closes the application.
 * @evidence contracts/e2e.md#preserved-coverage The original selected count call remains an actual PATCH; exact count, endpoint totals, filter, progress and concurrency assertions survive in the batch owner.
 */
export const test_api_count = async (
  connection: api.IConnection,
): Promise<void> => {
  const result = await api.functional.benchmark.count(connection);
  if (result !== 1)
    throw new Error("Benchmark PATCH returned an incorrect value.");
};
