import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";

import api from "../../../api";

/**
 * Verifies `"stringify": "validate.log"` logs an invalid `@TypedQuery.Get()`
 * response and sends it, as it does a `@TypedRoute` JSON one.
 *
 * The querified responses had no `validate.log` mode: the transform took its
 * `assert` default, so the route answered 500 instead of logging (#1727).
 *
 * 1. Register a logger and fetch a route whose response has an invalid `id`.
 * 2. Assert it answers 200 with the querified body.
 * 3. Assert exactly one log entry names the method, path, and the error.
 */
export const test_api_query_validate_log = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));

  const response: Response = await fetch(`${connection.host}/query`);
  TestValidator.equals("status", response.status, 200);
  TestValidator.equals("body", await response.text(), "id=wrong-data&count=3");
  TestValidator.equals("logs", logs.length, 1);
  TestValidator.equals("method", logs[0]?.method, "GET");
  TestValidator.equals("path", logs[0]?.path, "/query");
  TestValidator.equals(
    "error path",
    logs[0]?.errors.map((e) => e.path),
    ["$input.id"],
  );
};
