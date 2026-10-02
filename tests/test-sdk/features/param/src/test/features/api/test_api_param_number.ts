import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies numeric path conversion preserves one and rejects boolean and
 * nonnumeric strings.
 *
 * The generated SDK path and native TypedParam number validator meet at the
 * HTTP boundary.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the number echo controller must return 1, while boolean and nonnumeric
 *    string spellings must fail with HTTP 400.
 */
export const test_api_param_number = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number = await api.functional.param.number(connection, 1);
  typia.assert(value);
  TestValidator.equals("number echo", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.param.number(connection, true as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.number(connection, "string" as any),
  );
};
