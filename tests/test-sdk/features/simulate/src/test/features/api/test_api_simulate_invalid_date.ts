import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Calls the generated first simulator with an explicitly malformed
 * calendar-date parameter and requires HttpError 400.
 */
export const test_api_simulate_invalid_date = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid date", 400, () =>
    api.functional.bbs.articles.first(connection, "general", "not-a-date"),
  );
