import type { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import type { IPage } from "@api/lib/structures/IPage";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_v2_bbs_articles_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsArticle.ISummary>> =
    await api.functional.v2.bbs.articles.index(
      connection,
      typia.random<string>(),
      typia.random<IPage.IRequest>(),
    );
  typia.assert(output);
};
