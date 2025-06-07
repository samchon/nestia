import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

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
  > = await api.functional.bbs.articles.update(connection, {
    section: typia.random<string>(),
    id: typia.random<string & Format<"uuid">>(),
    input: typia.random<api.functional.bbs.articles.update.Body>(),
  });
  typia.assert(output);
};
