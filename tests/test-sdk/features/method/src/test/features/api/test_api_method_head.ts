import { TestValidator } from "@nestia/e2e";

import api from "./../../../api";

/** Validates the generated consumer result. */
export const test_api_method_head = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = await api.functional.method.head(connection);
  TestValidator.equals("HEAD has no response body", x, undefined);
};
