import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: IBbsArticle;
    },
    201
  > = await api.functional.bbs.articles.store(connection, {
    section: typia.random<string>(),
    input: typia.random<api.functional.bbs.articles.store.Body>(),
  });
  typia.assert(output);
};
