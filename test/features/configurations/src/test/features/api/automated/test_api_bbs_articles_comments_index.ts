import type { Primitive } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api/bbs";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_bbs_articles_comments_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsComment>> =
    await api.functional.bbs.articles.comments.index(
      connection,
      typia.random<string>(),
      typia.random<string & Format<"uuid">>(),
      typia.random<IPage.IRequest>(),
    );
  typia.assert(output);
};
