import { TestValidator } from "@nestia/e2e";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification Actual response serialization sends exact querified UUID/count text with200 and rejects the wrong UUID with500/errors containing only $input.id.
 * @evidence contracts/testing.md#independent-expectations The authored valid object defines id/count text; the invalid controller changes only UUID spelling, so the independent validation path is exactly $input.id.
 * @evidence contracts/testing.md#distinguishing-cases Valid UUID/count200 contrasts with invalid UUID500; exact error-path population detects accidental validation of URLSearchParams instead of the original object.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The stringify:validate native serializer must agree with actual HTTP status and querified/error response bodies.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_response_validate_query_route_validate = async (
  connection: api.IConnection,
): Promise<void> => {
  const valid: Response = await fetch(
    `${connection.host}/http_rich/options/response_validate/query/valid`,
  );
  TestValidator.equals("valid status", valid.status, 200);
  TestValidator.equals(
    "valid body",
    await valid.text(),
    "id=7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69&count=3",
  );

  const invalid: Response = await fetch(
    `${connection.host}/http_rich/options/response_validate/query/invalid`,
  );
  TestValidator.equals("invalid status", invalid.status, 500);
  const body = (await invalid.json()) as { errors: Array<{ path: string }> };
  TestValidator.equals(
    "invalid errors",
    body.errors.map((e) => e.path),
    ["$input.id"],
  );
};
