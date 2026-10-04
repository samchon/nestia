import typia from "typia";

import { IgnoreIBbsArticle } from "../../../../../../structures/customized/ignore/IgnoreIBbsArticle";
import api from "../../api";

/**
 * Verifies calls visible store and validates its article response.
 *
 * The authored nonignored store route returns IgnoreIBbsArticle.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The original visible store receives an authored random DTO and its article response must satisfy assertEquals.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases The original visible store receives an authored random DTO and its article response must satisfy assertEquals.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The generated store client must send the authored DTO to the actual transformed controller and return a response accepted by its independent source-type validator.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_ignore_store = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IgnoreIBbsArticle =
    await api.functional.http_rich.options.customized.ignore_bbs.articles.store(
      connection,
      typia.random<IgnoreIBbsArticle.IStore>(),
    );
  typia.assertEquals(article);
};
