import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IPageIBbsArticle } from "../../../../api/structures/IPageIBbsArticle";

export const test_api_bbs_articles_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: IPageIBbsArticle.ISummary;
    },
    200
  > = await api.functional.bbs.articles.index(
    connection,
    typia.random<string>(),
    typia.random<api.functional.bbs.articles.index.Query>(),
  );
  typia.assert(output);
};
