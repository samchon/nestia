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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls visible store and validates its article response.
 * @evidence contracts/testing.md#independent-expectations The authored nonignored store route returns IBbsArticle.
 * @evidence contracts/testing.md#distinguishing-cases Store remains callable while the erase case owns absence of the ignored accessor.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Calls visible store and validates its article response. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Store remains callable while the erase case owns absence of the ignored accessor. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
