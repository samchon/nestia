import typia from "typia";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_x_bbs_articles_comments_store = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsComment> =
    await api.functional.x.bbs.articles.comments.store(
      connection,
      typia.random<string>(),
      typia.random<string & Format<"uuid">>(),
      typia.random<IBbsComment.IStore>(),
    );
  typia.assert(output);
};
