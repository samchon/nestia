import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_x_bbs_articles_update = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.x.bbs.articles.update(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assert(output);
};
