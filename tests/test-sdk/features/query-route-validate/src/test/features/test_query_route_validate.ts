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
