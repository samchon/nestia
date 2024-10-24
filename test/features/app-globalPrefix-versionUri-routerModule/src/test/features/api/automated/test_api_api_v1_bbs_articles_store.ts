import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_api_v1_bbs_articles_store = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.api.v1.bbs.articles.store(
      connection,
      typia.random<string>(),
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assert(output);
};
