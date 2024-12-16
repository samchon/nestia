import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

export const test_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean = await api.functional.param.boolean(connection, false);
  typia.assert(value);

  TestValidator.equals("false")(false)(
    await api.functional.param.boolean(connection, 0 as any),
  );
  TestValidator.equals("true")(true)(
    await api.functional.param.boolean(connection, 1 as any),
  );

  await TestValidator.httpError("number")(400)(() =>
    api.functional.param.boolean(connection, 2 as any),
  );
  await TestValidator.httpError("string")(400)(() =>
    api.functional.param.boolean(connection, "string" as any),
  );
};
