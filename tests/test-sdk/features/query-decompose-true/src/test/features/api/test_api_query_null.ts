import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies typed query serialization retains a nullable null field.
 *
 * Generated null serialization must agree with native TypedQuery null decoding.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the nullable atomic field must remain null alongside valid numeric,
 *    boolean and array neighbors rather than become omitted or textual null.
 *
 * @evidence contracts/testing.md#behavioral-verification The nullable atomic field must remain null alongside valid numeric, boolean and array neighbors rather than become omitted or textual null.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The nullable atomic field must remain null alongside valid numeric, boolean and array neighbors rather than become omitted or textual null.
 * @evidence contracts/testing.md#distinguishing-cases The nullable atomic field must remain null alongside valid numeric, boolean and array neighbors rather than become omitted or textual null.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-true installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated null serialization must agree with native TypedQuery null decoding.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-true fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-true fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_null = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: null,
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.typed(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
