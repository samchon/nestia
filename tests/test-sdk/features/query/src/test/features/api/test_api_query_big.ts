import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBigQuery } from "@api/lib/structures/IBigQuery";

/**
 * Verifies URL-encoded bigint and null fields survive a generated body round
 * trip.
 *
 * URLSearchParams wire conversion and native typed query-body decoding must
 * agree on bigint and null.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the controller echo must return the authored 100n and null values with
 *    the IBigQuery shape intact.
 *
 * @evidence contracts/testing.md#behavioral-verification The controller echo must return the authored 100n and null values with the IBigQuery shape intact.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The controller echo must return the authored 100n and null values with the IBigQuery shape intact.
 * @evidence contracts/testing.md#distinguishing-cases The controller echo must return the authored 100n and null values with the IBigQuery shape intact.
 * @evidence contracts/testing.md#execution-ownership The query installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary URLSearchParams wire conversion and native typed query-body decoding must agree on bigint and null.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_big = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBigQuery = {
    value: BigInt(100),
    nullable: null,
  };
  const result: IBigQuery = await api.functional.query.big(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
