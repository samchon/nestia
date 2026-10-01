import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies the simulator refuses headers the server's validator refuses, with
 * the same 400, and simulates valid ones.
 *
 * The simulator validated path parameters, the query, and the body, but not
 * `@TypedHeaders()`, so a request the server refused with 400 succeeded in
 * simulation (#1721).
 *
 * 1. Send an invalid `x-id` to the server and to the simulator: both reject with
 *    400.
 * 2. Send a valid one to the simulator: it answers.
 *
 * @evidence contracts/testing.md#behavioral-verification Malformed x-id must reject with400 on both server and simulator; valid simulated headers must return a string.
 * @evidence contracts/testing.md#independent-expectations Authored UUID-tagged TypedHeaders and string result establish explicit invalid/valid input and result-shape expectations.
 * @evidence contracts/testing.md#distinguishing-cases Real/simulated invalid header contrasts valid simulated input; valid random output is checked only for string type.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_simulate_headers after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual server validation and independently generated simulator validation must both execute; only one side cannot establish HEAD/header parity or propagation semantics.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and its feature backend and generated client rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Connections and supplied values belong to this invocation; simulate flags and header objects are local copies. Sequential cases share only their feature backend, which the entry closes in finally; copied outputs remain isolated.
 * @evidence contracts/e2e.md#preserved-coverage The test_simulate_headers selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_simulate_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const simulate of [false, true])
    await TestValidator.httpError(`simulate ${simulate}`, 400, () =>
      api.functional.headers.get({
        host: connection.host,
        simulate,
        headers: { "x-id": "not-a-uuid" },
      }),
    );
  TestValidator.equals(
    "valid",
    typeof (await api.functional.headers.get({
      host: connection.host,
      simulate: true,
      headers: { "x-id": "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69" },
    })),
    "string",
  );
};
