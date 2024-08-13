import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_update = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: IBbsArticle;
    },
    200
  > = await api.functional.bbs.articles.update(
    connection,
    typia.random<string>(),
    typia.random<string & Format<"uuid">>(),
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assert(output);
};
