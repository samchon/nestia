import type { Primitive, tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_$package_articles_at = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.bbs.$package.articles.at(
      connection,
      typia.random<string>(),
      typia.random<(string & tags.Format<"uuid">) | null>(),
    );
  typia.assert(output);
};
