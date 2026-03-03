import type { IBbsComment } from "@api/lib/structures/IBbsComment";
import type { IPage } from "@api/lib/structures/IPage";
import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";

export const test_api_bbs_articles_comments_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsComment>> =
    await api.functional.bbs.articles.comments.index(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<IPage.IRequest>(),
    );
  typia.assert(output);
};
