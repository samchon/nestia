import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.httpError("invalid", 400, () =>
    api.functional.bbs.articles.index(connection, "section", {
      page: "not-a-number" as any,
      limit: 100,
    }),
  );
};
