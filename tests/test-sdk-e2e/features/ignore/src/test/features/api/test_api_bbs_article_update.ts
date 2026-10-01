import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies api bbs article update through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated store must return an exact IBbsArticle-shaped value and the generated visible update request using its id must resolve.
 * @evidence contracts/testing.md#independent-expectations Authored article store/update declarations establish accepted input and return shapes. Installed typia provides generated valid requests and the store oracle; update return content is not asserted by this case.
 * @evidence contracts/testing.md#distinguishing-cases Store followed by id-parameter update retains both visible accessors alongside ignored erase. The fixture does not establish persistent article storage or a later read-after-write transition.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual SDK generation, id parameter encoding and HTTP body handling must connect for the visible update route; a namespace inspection cannot prove this request succeeds.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
