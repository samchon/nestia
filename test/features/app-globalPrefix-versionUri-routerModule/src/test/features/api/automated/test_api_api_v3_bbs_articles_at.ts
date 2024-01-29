import type { Primitive } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_api_v3_bbs_articles_at = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.api.v3.bbs.articles.at(
      connection,
      typia.random<string>(),
      typia.random<string & Format<"uuid">>(),
    );
  typia.assert(output);
};
