import typia from "typia";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_api_v2_articles_comments_update = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsComment> =
    await api.functional.api.v2.articles.comments.update(
      connection,
      typia.random<string>(),
      typia.random<string & Format<"uuid">>(),
      typia.random<string & Format<"uuid">>(),
      typia.random<api.functional.api.v2.articles.comments.update.Body>(),
    );
  typia.assert(output);
};
