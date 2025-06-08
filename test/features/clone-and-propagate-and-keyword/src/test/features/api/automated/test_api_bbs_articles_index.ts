import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IPage } from "../../../../api/structures/IPage";
import type { IPageIBbsArticle } from "../../../../api/structures/IPageIBbsArticle";

export const test_api_bbs_articles_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: IPageIBbsArticle.ISummary;
    },
    200
  > = await api.functional.bbs.articles.index(connection, {
    section: typia.random<string>(),
    query: typia.random<IPage.IRequest>(),
  });
  typia.assert(output);
};
