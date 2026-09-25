import typia from "typia";

import api from "../../../../api";
import { IBbsArticle } from "../../../../features/body-manual-assert/api/structures/IBbsArticle";

export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.body_manual_assert.body.store(
      connection,
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assertEquals(article);
};
