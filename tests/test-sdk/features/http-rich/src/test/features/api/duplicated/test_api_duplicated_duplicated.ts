import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

import { IBbsArticle } from "../../../../structures/duplicated/IBbsArticle";

/**
 * Verifies calls duplicated and multiple routes, validates both article shapes
 * and compares their responses.
 *
 * Both authored route names expose the same controller value and IBbsArticle
 * contract.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Both authored duplicated route names must return exact article shapes and equal values from the same controller value.
 * @evidence contracts/testing.md#independent-expectations The original controller exposes one immutable article through two declared paths and the original IBbsArticle establishes their exact response shape.
 * @evidence contracts/testing.md#distinguishing-cases Calling both route aliases and comparing their values distinguishes a missing or misrouted alias from the correct shared controller response.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from duplicated/src/test/features/api/test_api_duplicated.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_duplicated_duplicated = async (
  connection: api.IConnection,
): Promise<void> => {
  const [x, y]: [IBbsArticle, IBbsArticle] = [
    await api.functional.http_rich.duplicated.duplicated.at(connection),
    await api.functional.http_rich.duplicated.multiple.at(connection),
  ];
  typia.assertEquals([x, y]);

  TestValidator.equals("duplicated", x, y);
};
