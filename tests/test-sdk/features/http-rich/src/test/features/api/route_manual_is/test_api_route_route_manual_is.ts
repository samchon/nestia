import typia from "typia";

import api from "../../../../api";
import { IBbsArticle } from "../../../../structures/route_manual_is/IBbsArticle";

/**
 * Calls the route configured with an explicit is stringifier and validates
 * exact IBbsArticle output.
 *
 * The preserved authored controller and DTOs establish this response contract.
 *
 * 1. Execute the scenario's emitted client or request against the shared
 *    artifacts.
 * 2. Assert its independently authored shape, transport or path expectation.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated route request must return a value satisfying the exact preserved authored IBbsArticle shape after the scenario response serializer executes.
 * @evidence contracts/testing.md#independent-expectations The original IBbsArticle declaration establishes the independent response shape, including the fields that the controller may produce beyond its declared output.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the actual explicit route manual is serializer connection and exact output shape. Other authored serializer variants run against distinct routes in the same application.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from route-manual-is/src/test/features/api/test_api_route.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_route_route_manual_is = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.http_rich.route_manual_is.route.random(connection);
  typia.assertEquals(article);
};
