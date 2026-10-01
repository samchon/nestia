import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies the SDK of a `HEAD` route with a parameter compiles and simulates
 * under `simulate: true`.
 *
 * The simulate function handed `NestiaSimulator.assert()` the `"HEAD"` method
 * and the `null` content type of a bodiless response, neither of which its
 * props admitted, so the SDK did not compile (#1723).
 *
 * 1. Call the route on the server and in simulation with a valid id.
 * 2. Call both with an invalid id: both reject with 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Server and simulator HEAD calls must both resolve undefined for a valid UUID and reject malformed UUID with400.
 * @evidence contracts/testing.md#independent-expectations The authored bodiless HEAD response and UUID-tagged parameter prescribe undefined and malformed-input400 independently of generated simulator output.
 * @evidence contracts/testing.md#distinguishing-cases Real versus simulate:true and accepted versus malformed UUID retain four controls, including bodyless success.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_simulate_head after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual server validation and independently generated simulator validation must both execute; only one side cannot establish HEAD/header parity or propagation semantics.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and its feature backend and generated client rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Connections and supplied values belong to this invocation; simulate flags and header objects are local copies. Sequential cases share only their feature backend, which the entry closes in finally; copied outputs remain isolated.
 * @evidence contracts/e2e.md#preserved-coverage The test_simulate_head selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_simulate_head = async (
  connection: api.IConnection,
): Promise<void> => {
  const id: string = "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69";
  for (const simulate of [false, true]) {
    TestValidator.equals(
      `simulate ${simulate} bodyless success`,
      await api.functional.heads.head({ ...connection, simulate }, id),
      undefined,
    );
    await TestValidator.httpError(`simulate ${simulate} invalid`, 400, () =>
      api.functional.heads.head({ ...connection, simulate }, "not-a-uuid"),
    );
  }
};
