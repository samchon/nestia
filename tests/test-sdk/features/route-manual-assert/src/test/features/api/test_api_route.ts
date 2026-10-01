import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated random article route decodes its DTO.
 *
 * This case consumes the route-manual-assert feature's generated artifact.
 *
 * 1. Call the generated random article GET with the feature connection.
 * 2. Assert the result is exactly the handwritten IBbsArticle DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated random route GET must succeed and its decoded article must satisfy assertEquals<IBbsArticle>, detecting wrong response shapes and extra response fields.
 * @evidence contracts/testing.md#independent-expectations IBbsArticle is the handwritten controller return contract; random values vary but its required fields and tagged constraints are independent of generated client code.
 * @evidence contracts/testing.md#distinguishing-cases This is the valid response under this feature's serializer configuration; dedicated manual validator and validate-log cases own rejection or logging. It does not claim a particular random article value.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this export and awaits it against the backend after generation; actual request transport is executed in the feature runtime program.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and the configured manual or native response serializer must produce compatible wire data; direct serializer-source assertions cannot establish fetcher decoding.
 * @evidence contracts/e2e.md#shared-execution It reuses the feature's SDK/backend and sibling monitor preparation, without starting another host or compiler. Configuration/runtime cohorts are shared; file-input reflection remains per configuration.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The route creates independent random data and changes no retained fixture state; shape validation permits varying values. The feature entry owns its port and finally closes the backend on reports or discovery/startup failure.
 * @evidence contracts/e2e.md#preserved-coverage The original generated GET and exact DTO assertion remain; serializer-specific malformed response cases and void/performance cases retain their separate owners.
 */
export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.route.random(connection);
  typia.assertEquals(article);
};
