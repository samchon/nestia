import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

export const test_api_param_number = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number = await api.functional.param.bigint(
    connection,
    BigInt(1),
  );
  typia.assert(value);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.param.bigint(connection, true as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.bigint(connection, "string" as any),
  );
};
