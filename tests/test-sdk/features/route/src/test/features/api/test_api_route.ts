import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Calls generated route.random over HTTP and checks exact IBbsArticle structure
 * after server serialization.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generated route.random over HTTP and checks exact IBbsArticle structure after server serialization.
 * @evidence contracts/testing.md#independent-expectations IBbsArticle is the authored controller return contract; exact validation detects missing fields and leaked extra controller properties.
 * @evidence contracts/testing.md#distinguishing-cases The controller includes an extra dummy field, while the serializer must emit only declared fields. This case owns successful typed serialization; malformed output logging has separate cases.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. The controller includes an extra dummy field, while the serializer must emit only declared fields. This case owns successful typed serialization; malformed output logging has separate cases.
 */
export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.route.random(connection);
  typia.assertEquals(article);
};
