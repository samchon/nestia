import typia from "typia";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_x_bbs_articles_at = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> = await api.functional.x.bbs.articles.at(
    connection,
    typia.random<string>(),
    typia.random<string & Format<"uuid">>(),
  );
  typia.assert(output);
};
