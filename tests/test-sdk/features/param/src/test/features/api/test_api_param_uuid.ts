import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

/**
 * Verifies a UUID path echoes while null and malformed UUID text are rejected.
 *
 * Generated path transport and the native UUID format tag must agree.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the supplied UUID must be returned unchanged; null and 12345678 must
 *    throw.
 */
export const test_api_param_uuid = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  await TestValidator.error("null", () =>
    api.functional.param.uuid(connection, null!),
  );
  await TestValidator.error("invalid", () =>
    api.functional.param.uuid(connection, "12345678"),
  );
};
