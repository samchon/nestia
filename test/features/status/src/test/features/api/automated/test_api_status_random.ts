import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_status_random = async (connection: api.IConnection) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.status.random(connection);
  typia.assert(output);
};
