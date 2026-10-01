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
 * @evidence contracts/testing.md#behavioral-verification Raw valid query response must be200 with the exact id/count encoding, while the invalid response is500 naming only $input.id.
 * @evidence contracts/testing.md#independent-expectations Authored valid/invalid handlers differ in their UUID value and retain count3. Handwritten valid UUID/query string and selected invalid path independently establish expected serialization and failure scope.
 * @evidence contracts/testing.md#distinguishing-cases Valid versus one-field-invalid objects distinguish validate-before-querify from validating the already built URLSearchParams. Both status and exact response/error path are observed.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native query response validator, querifier and HTTP error handling must connect; a local validation-mode argument assertion cannot prove the emitted response.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
