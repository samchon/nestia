import type { tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_body_update = async (connection: api.IConnection) => {
  const output = await api.functional.body.update(
    connection,
    typia.random<string & tags.Format<"uuid">>(),
    typia.random<Partial<IBbsArticle.IStore>>(),
  );
  typia.assert(output);
};
