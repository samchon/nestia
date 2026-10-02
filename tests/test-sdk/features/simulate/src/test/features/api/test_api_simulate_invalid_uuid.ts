import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Calls the generated at simulator with an explicitly malformed UUID and
 * requires HttpError 400.
 */
export const test_api_simulate_invalid_uuid = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid uuid", 400, () =>
    api.functional.bbs.articles.at(connection, "general", "not-a-uuid"),
  );
