import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_v2_bbs_articles_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsArticle.ISummary>> =
    await api.functional.v2.bbs.articles.index(
      connection,
      typia.random<string>(),
      typia.random<api.functional.v2.bbs.articles.index.Query>(),
    );
  typia.assert(output);
};
