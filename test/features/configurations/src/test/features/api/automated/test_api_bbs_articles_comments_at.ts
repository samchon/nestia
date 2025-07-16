import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api/bbs";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_bbs_articles_comments_at = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsComment> =
    await api.functional.bbs.articles.comments.at(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<string & tags.Format<"uuid">>(),
    );
  typia.assert(output);
};
