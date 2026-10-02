import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a bigint path parameter converts to the controller number result and
 * invalid spellings fail.
 *
 * Generated path encoding and native TypedParam bigint parsing must agree
 * across an HTTP request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the controller returns Number(value), so 1n must return 1; boolean and
 *    nonnumeric string values must produce HTTP 400.
 */
export const test_api_param_bigint = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number = await api.functional.param.bigint(
    connection,
    BigInt(1),
  );
  typia.assert(value);
  TestValidator.equals("bigint conversion", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.param.bigint(connection, true as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.bigint(connection, "string" as any),
  );
};
