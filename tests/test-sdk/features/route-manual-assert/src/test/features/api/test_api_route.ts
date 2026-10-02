import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Calls the route configured with an explicit assert stringifier and validates
 * exact IBbsArticle output.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the route configured with an explicit assert stringifier and validates exact IBbsArticle output.
 * @evidence contracts/testing.md#independent-expectations The authored assert option selects its supplied typia stringifier; IBbsArticle declares the fields that may cross serialization.
 * @evidence contracts/testing.md#distinguishing-cases The controller adds dummy:1 while the exact article assertion rejects leaked extras. This case owns valid manual assert serialization; other manual modes remain separate input configurations.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route-manual-assert/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route-manual-assert fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. The controller adds dummy:1 while the exact article assertion rejects leaked extras. This case owns valid manual assert serialization; other manual modes remain separate input configurations.
 */
export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.route.random(connection);
  typia.assertEquals(article);
};
