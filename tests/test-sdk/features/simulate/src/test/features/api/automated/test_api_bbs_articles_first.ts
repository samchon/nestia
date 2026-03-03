import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_first = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.bbs.articles.first(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"date">>(),
    );
  typia.assert(output);
};
