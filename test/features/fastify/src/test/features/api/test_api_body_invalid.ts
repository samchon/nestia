import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid")(400)(() =>
    api.functional.bbs.articles.store(connection, typia.random<string>(), {
      ...typia.random<IBbsArticle.IStore>(),
      title: null!,
    }),
  );
};
