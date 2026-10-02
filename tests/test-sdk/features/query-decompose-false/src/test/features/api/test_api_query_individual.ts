import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a named scalar query parameter echoes its exact value.
 *
 * Generated scalar query naming must match the controller Query id field over
 * HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored some-value text must survive query encoding and named
 *    Query extraction unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored some-value text must survive query encoding and named Query extraction unchanged.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored some-value text must survive query encoding and named Query extraction unchanged.
 * @evidence contracts/testing.md#distinguishing-cases The authored some-value text must survive query encoding and named Query extraction unchanged.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-false installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated scalar query naming must match the controller Query id field over HTTP.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-false fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-false fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_individual = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: string = "some-value";
  const value: string = await api.functional.query.individual(
    connection,
    "some-value",
  );
  typia.assertEquals(value);
  TestValidator.equals("individual", input, value);
};
