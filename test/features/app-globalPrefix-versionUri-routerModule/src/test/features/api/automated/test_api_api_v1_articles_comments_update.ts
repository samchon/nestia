import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_api_v1_articles_comments_update = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsComment> =
    await api.functional.api.v1.articles.comments.update(
      connection,
      typia.random<string>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<string & tags.Format<"uuid">>(),
      typia.random<IBbsComment.IStore>(),
    );
  typia.assert(output);
};
