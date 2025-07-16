import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IBbsArticle } from "../../../../controllers/TypedBodyController";

export const test_api_body_store = async (connection: api.IConnection) => {
  const output: Primitive<IBbsArticle> = await api.functional.body.store(
    connection,
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assert(output);
};
