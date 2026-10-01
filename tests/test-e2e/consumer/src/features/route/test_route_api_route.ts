import typia from "typia";

import api from "../../api";
import { IBbsArticleRoute } from "../../oracle/route/structures/IBbsArticleRoute";

/**
 * Verifies the generated random article route decodes its DTO.
 *
 * This case consumes the route feature's generated artifact.
 *
 * 1. Call the generated random article GET with the feature connection.
 * 2. Assert the result is exactly the handwritten IBbsArticleRoute DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated random route GET must succeed and its decoded article must satisfy assertEquals<IBbsArticleRoute>, detecting wrong response shapes and extra response fields.
 * @evidence contracts/testing.md#independent-expectations IBbsArticleRoute is the handwritten controller return contract; random values vary but its required fields and tagged constraints are independent of generated client code.
 * @evidence contracts/testing.md#distinguishing-cases This is the valid response under this feature's serializer configuration; dedicated manual validator and validate-log cases own rejection or logging. It does not claim a particular random article value.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and the configured manual or native response serializer must produce compatible wire data; direct serializer-source assertions cannot establish fetcher decoding.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The original generated GET and exact DTO assertion remain; serializer-specific malformed response cases and void/performance cases retain their separate owners.
 */
export const test_route_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticleRoute =
    await api.functional.route.route.random(connection);
  typia.assertEquals(article);
};
