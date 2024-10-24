import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_bbs_articles_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsArticle.ISummary>> =
    await api.functional.bbs.articles.index(
      connection,
      typia.random<null | string>(),
      typia.random<IPage.IRequest>(),
    );
  typia.assert(output);
};
