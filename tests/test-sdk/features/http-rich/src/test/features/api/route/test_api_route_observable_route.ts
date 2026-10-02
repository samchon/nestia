import typia from "typia";

import api from "@api";

import { IBbsArticle } from "../../../../structures/route/IBbsArticle";

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
 * @evidence contracts/testing.md#behavioral-verification The emitted client result is assigned to the authored IBbsArticle and must satisfy its exact structure after an Observable response reaches HTTP.
 * @evidence contracts/testing.md#independent-expectations The authored Observable<IBbsArticle> endpoint is resolved by Nest to its payload, so the result must be the article rather than an Observable-shaped value or void.
 * @evidence contracts/testing.md#distinguishing-cases This case owns Observable return unwrapping; the neighboring ordinary Promise route remains an independent response control.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from route/src/test/features/api/test_api_route_observable.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_route_observable_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.http_rich.route.route.observable(connection);

  typia.assertEquals(article);
};
