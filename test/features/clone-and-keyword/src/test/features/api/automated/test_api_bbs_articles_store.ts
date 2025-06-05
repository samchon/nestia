import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_store = async (
  connection: api.IConnection,
) => {
  const output: IBbsArticle = await api.functional.bbs.articles.store(
    connection,
    {
      section: typia.random<string>(),
      input: typia.random<IBbsArticle.IStore>(),
    },
  );
  typia.assert(output);
};
