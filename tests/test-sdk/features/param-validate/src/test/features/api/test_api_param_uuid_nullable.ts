import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

/**
 * Verifies a nullable UUID path accepts a UUID and null but rejects malformed
 * text.
 *
 * The SDK null spelling must reach the nullable tagged native parameter as
 * null.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored UUID echoes, null returns null, and 12345678 is rejected.
 */
export const test_api_param_uuid_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid_nullable(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  TestValidator.equals(
    "null",
    await api.functional.param.uuid_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.uuid_nullable(connection, "12345678"),
  );
};
