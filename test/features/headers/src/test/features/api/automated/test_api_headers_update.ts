import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_headers_update = async (connection: api.IConnection) => {
  const output = await api.functional.headers.update(
    connection,
    typia.random<string>(),
    typia.random<string & Format<"uuid">>(),
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assert(output);
};
