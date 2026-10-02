import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies an invalid boolean query field rejects before the test completes.
 *
 * TypedQuery runtime rejection must arrive through the generated SDK as an HTTP
 * failure.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the enforce field alone changes from boolean to something while the
 *    other fields remain valid; the request must reject with HTTP 400 and its
 *    validator promise is awaited.
 *
 * @evidence contracts/testing.md#behavioral-verification The enforce field alone changes from boolean to something while the other fields remain valid; the request must reject with HTTP 400 and its validator promise is awaited.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The enforce field alone changes from boolean to something while the other fields remain valid; the request must reject with HTTP 400 and its validator promise is awaited.
 * @evidence contracts/testing.md#distinguishing-cases The enforce field alone changes from boolean to something while the other fields remain valid; the request must reject with HTTP 400 and its validator promise is awaited.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-true installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary TypedQuery runtime rejection must arrive through the generated SDK as an HTTP failure.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-true fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-true fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.query.typed(connection, {
      limit: 10,
      enforce: "something" as any,
      values: ["a", "b", "c"],
      atomic: "atomic",
    }),
  );
};
