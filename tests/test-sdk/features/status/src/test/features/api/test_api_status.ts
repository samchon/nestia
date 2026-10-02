import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Checks generated status metadata is 300, calls the SDK and validates exact
 * article output.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks generated status metadata is 300, calls the SDK and validates exact article output.
 * @evidence contracts/testing.md#independent-expectations The fixture explicitly declares HttpCode(300) and IBbsArticle, establishing status and payload requirements independently.
 * @evidence contracts/testing.md#distinguishing-cases Nondefault 300 metadata and successful article parsing distinguish SDK status propagation from treating it as an ordinary default response.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under status/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The status fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Nondefault 300 metadata and successful article parsing distinguish SDK status propagation from treating it as an ordinary default response.
 */
export const test_api_status = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "status",
    300,
    api.functional.status.random.METADATA.status!,
  );

  const article: IBbsArticle = await api.functional.status.random(connection);
  typia.assertEquals(article);
};
