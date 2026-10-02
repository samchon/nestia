import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies `"stringify": "validate"` validates a `@TypedQuery.Get()` response
 * as the object it is, sending a valid one and refusing an invalid one.
 *
 * The querified `validate` validator checked the `URLSearchParams` it had
 * already built against the object type, so every property read as absent and
 * every response, valid or not, answered 500 (#1727).
 *
 * 1. Fetch a route answering a valid object: 200 with the querified body.
 * 2. Fetch one answering an invalid `id`: 500 naming only `$input.id`.
 *
 * @evidence contracts/testing.md#behavioral-verification The valid response returns 200 with the authored id/count query text; the invalid response returns 500 with only the $input.id error path.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The valid response returns 200 with the authored id/count query text; the invalid response returns 500 with only the $input.id error path.
 * @evidence contracts/testing.md#distinguishing-cases The valid response returns 200 with the authored id/count query text; the invalid response returns 500 with only the $input.id error path.
 * @evidence contracts/testing.md#execution-ownership The query-route-validate installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The native response validator and generated query serializer must compose correctly inside the real backend.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-route-validate fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-route-validate fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_query_route_validate = async (
  connection: api.IConnection,
): Promise<void> => {
  const valid: Response = await fetch(`${connection.host}/query/valid`);
  TestValidator.equals("valid status", valid.status, 200);
  TestValidator.equals(
    "valid body",
    await valid.text(),
    "id=7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69&count=3",
  );

  const invalid: Response = await fetch(`${connection.host}/query/invalid`);
  TestValidator.equals("invalid status", invalid.status, 500);
  const body = (await invalid.json()) as { errors: Array<{ path: string }> };
  TestValidator.equals(
    "invalid errors",
    body.errors.map((e) => e.path),
    ["$input.id"],
  );
};
