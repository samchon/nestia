import type { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_api_v3_bbs_articles_store = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.api.v3.bbs.articles.store(
      connection,
      typia.random<string>(),
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assert(output);
};
