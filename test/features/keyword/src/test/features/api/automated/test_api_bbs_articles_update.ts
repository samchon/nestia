import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_update = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.bbs.articles.update(connection, {
      section: typia.random<string>(),
      id: typia.random<string & tags.Format<"uuid">>(),
      input: typia.random<IBbsArticle.IStore>(),
    });
  typia.assert(output);
};
