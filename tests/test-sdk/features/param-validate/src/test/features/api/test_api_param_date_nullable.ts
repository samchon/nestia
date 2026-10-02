import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a nullable date path preserves both the date and null alternatives.
 *
 * The HTTP path spelling for null must agree with nullable native validation.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert date equality and an explicit null result preserve the declared
 *    nullable domain; 20140102 remains invalid.
 */
export const test_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value = await api.functional.param.date_nullable(connection, date);
  TestValidator.equals("date", date, value);

  TestValidator.equals(
    "null",
    await api.functional.param.date_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.date_nullable(connection, "20140102"),
  );
};
