import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a date-formatted path value echoes and invalid date spellings fail.
 *
 * The generated client and tagged native path validator are connected by a real
 * request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert a valid date string must echo exactly, while null and the
 *    delimiter-free 20140102 spelling must throw.
 */
export const test_api_param_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value = await api.functional.param.date(connection, date);
  TestValidator.equals("date", date, value);

  await TestValidator.error("null", () =>
    api.functional.param.date(connection, null!),
  );
  await TestValidator.error("invalid", () =>
    api.functional.param.date(connection, "20140102"),
  );
};
