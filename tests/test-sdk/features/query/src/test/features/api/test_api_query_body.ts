import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies URL-encoded typed body fields preserve scalars and repeated arrays.
 *
 * Generated form-body serialization and TypedQuery.Body validation connect
 * through HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored atomic text, numeric limit, boolean enforce and two
 *    distinct values must return exactly with no extra fields.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored atomic text, numeric limit, boolean enforce and two distinct values must return exactly with no extra fields.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored atomic text, numeric limit, boolean enforce and two distinct values must return exactly with no extra fields.
 * @evidence contracts/testing.md#distinguishing-cases The authored atomic text, numeric limit, boolean enforce and two distinct values must return exactly with no extra fields.
 * @evidence contracts/testing.md#execution-ownership The query installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated form-body serialization and TypedQuery.Body validation connect through HTTP.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    atomic: "atomic",
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.body(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("body", result, input);
};
