import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies boolean path conversion accepts false and the numeric 0/1 spellings
 * while rejecting other values.
 *
 * Generated path encoding and native TypedParam boolean parsing are exercised
 * together over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert false and zero return false, one returns true, and two or a nonboolean
 *    string produce HTTP 400.
 */
export const test_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean = await api.functional.param.boolean(connection, false);
  typia.assert(value);

  TestValidator.equals(
    "false",
    false,
    await api.functional.param.boolean(connection, 0 as any),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.param.boolean(connection, 1 as any),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.param.boolean(connection, 2 as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.boolean(connection, "string" as any),
  );
};
