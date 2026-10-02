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
 *
 * @evidence contracts/testing.md#behavioral-verification Stores a valid article then invokes update with its id and a valid update body.
 * @evidence contracts/testing.md#independent-expectations The authored store returns IBbsArticle and update returns void for a valid authored DTO.
 * @evidence contracts/testing.md#distinguishing-cases The connected store/update sequence checks visible operations; the ignored erase accessor is checked separately.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Stores a valid article then invokes update with its id and a valid update body. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The connected store/update sequence checks visible operations; the ignored erase accessor is checked separately. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
