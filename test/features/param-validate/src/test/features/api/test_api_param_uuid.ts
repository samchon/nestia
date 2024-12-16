import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

export const test_api_param_uuid = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid(connection, uuid);
  TestValidator.equals("uuid")(uuid)(value);

  await TestValidator.error("null")(() =>
    api.functional.param.uuid(connection, null!),
  );
  await TestValidator.error("invalid")(() =>
    api.functional.param.uuid(connection, "12345678"),
  );
};
