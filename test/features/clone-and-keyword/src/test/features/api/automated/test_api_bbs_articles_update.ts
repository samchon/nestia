import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_update = async (
  connection: api.IConnection,
) => {
  const output: IBbsArticle = await api.functional.bbs.articles.update(
    connection,
    {
      section: typia.random<string>(),
      id: typia.random<string & Format<"uuid">>(),
      input: typia.random<IBbsArticle.IStore>(),
    },
  );
  typia.assert(output);
};
