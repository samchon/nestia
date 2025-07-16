import type { tags } from "typia";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_headers_update = async (connection: api.IConnection) => {
  const output = await api.functional.headers.update(
    connection,
    typia.random<string>(),
    typia.random<string & tags.Format<"uuid">>(),
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assert(output);
};
