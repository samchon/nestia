import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_articles_comments_index = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPage<IBbsComment>> =
    await api.functional.articles.comments.index(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<IPage.IRequest>(),
    );
  typia.assert(output);
};
