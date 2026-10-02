import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies Nest Query string fields are emitted and converted into the
 * controller DTO.
 *
 * Generated INestQuery string serialization and the Nest Query parser connect
 * over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert authored numeric and boolean strings and repeated values convert to
 *    the independently supplied IQuery object with exact equality.
 *
 * @evidence contracts/testing.md#behavioral-verification Authored numeric and boolean strings and repeated values convert to the independently supplied IQuery object with exact equality.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: Authored numeric and boolean strings and repeated values convert to the independently supplied IQuery object with exact equality.
 * @evidence contracts/testing.md#distinguishing-cases Authored numeric and boolean strings and repeated values convert to the independently supplied IQuery object with exact equality.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-false installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated INestQuery string serialization and the Nest Query parser connect over HTTP.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-false fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-false fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.nest(connection, {
    ...input,
    limit: input.limit ? `${input.limit}` : undefined,
    enforce: input.enforce ? "true" : "false",
    atomic: input.atomic ? input.atomic : "null",
  });
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
