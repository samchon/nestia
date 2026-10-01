import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies api bbs article store through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated visible article store call must return an exact IBbsArticle-shaped value after receiving an IStore-valid random request.
 * @evidence contracts/testing.md#independent-expectations Authored IBbsArticle declares the request and response shapes. Installed typia supplies their random/shape oracle; no independent stable random response literal is asserted.
 * @evidence contracts/testing.md#distinguishing-cases This visible store accessor contrasts the ignored erase accessor in the same namespace. It establishes successful retained exposure and exact response shape, not every generated field echo or random-value quality.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated HTTP accessor and backend serializer must connect despite an ignored sibling; namespace absence alone cannot establish that visible routes still work.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
