import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies Observable<T> controller returns generate SDK output as T.
 *
 * Locks the native return-type unwrap branch shared by Swagger metadata and
 * generated SDK aliases. NestJS treats Observable<T> as an asynchronous route
 * response just like Promise<T>; a regression would emit Promise<void> or an
 * Observable-shaped schema instead of the resolved article type.
 *
 * 1. Call a controller method that returns Observable<IBbsArticle>.
 * 2. Assign the generated SDK result to IBbsArticle.
 * 3. Assert the runtime payload satisfies the article structure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated Observable article route and checks both assignability to IBbsArticle and its exact runtime shape.
 * @evidence contracts/testing.md#independent-expectations The authored Observable<IBbsArticle> controller contract requires its resolved article, not Observable structure or void.
 * @evidence contracts/testing.md#distinguishing-cases Observable unwrapping complements the Promise route. Exact article validation detects wrong wrapping and leaked properties; this case does not exercise Observable errors.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Observable unwrapping complements the Promise route. Exact article validation detects wrong wrapping and leaked properties; this case does not exercise Observable errors.
 */
export const test_api_route_observable = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.route.observable(connection);

  typia.assertEquals(article);
};
