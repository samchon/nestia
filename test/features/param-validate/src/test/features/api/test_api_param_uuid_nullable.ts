import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

export const test_api_param_uuid_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid_nullable(connection, uuid);
  TestValidator.equals("uuid")(uuid)(value!);

  TestValidator.equals("null")(
    await api.functional.param.uuid_nullable(connection, null),
  )(null);

  await TestValidator.error("invalid")(() =>
    api.functional.param.uuid_nullable(connection, "12345678"),
  );
};
