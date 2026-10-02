import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies calls visible store and validates its article response.
 *
 * The authored nonignored store route returns IBbsArticle.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_bbs_article_store = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.bbs.articles.store(
    connection,
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assertEquals(article);
};
