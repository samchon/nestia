import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_body_update = async (connection: api.IConnection) => {
  const output = await api.functional.body.update(
    connection,
    typia.random<string & Format<"uuid">>(),
    typia.random<Partial<IBbsArticle.IStore<string>>>(),
  );
  typia.assert(output);
};
