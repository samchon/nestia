import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_body_store = async (connection: api.IConnection) => {
  const output: Primitive<IBbsArticle<string>> =
    await api.functional.body.store(
      connection,
      typia.random<IBbsArticle.IStore<string>>(),
    );
  typia.assert(output);
};
