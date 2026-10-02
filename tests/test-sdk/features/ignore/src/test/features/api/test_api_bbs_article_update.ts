import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies stores a valid article then invokes update with its id and a valid
 * update body.
 *
 * The authored store returns IBbsArticle and update returns void for a valid
 * authored DTO.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_bbs_article_update = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.bbs.articles.store(
    connection,
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assertEquals(article);

  await api.functional.bbs.articles.update(
    connection,
    article.id,
    typia.random<IBbsArticle.IUpdate>(),
  );
};
