import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_ke_bab_with_dashes_store = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.ke_bab_with_dashes.store(
      connection,
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assert(output);
};
