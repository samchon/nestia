import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies the generated random article route decodes its DTO.
 *
 * Assert, is, stringify and validate callbacks share one generated project.
 *
 * 1. Call the generated random article GET with the feature connection.
 * 2. Assert the result is exactly the handwritten IBbsArticle DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification Each assert/is/stringify/validate route GET must succeed and its decoded article must satisfy assertEquals<IBbsArticle>, detecting wrong response shapes and the handler's extra dummy field leaking through serialization. All four callbacks run before aggregate failure is reported.
 * @evidence contracts/testing.md#independent-expectations IBbsArticle is the handwritten controller return contract; random values vary but its required fields and tagged constraints are independent of generated client code.
 * @evidence contracts/testing.md#distinguishing-cases All four explicitly supplied serializer callbacks receive valid article fields plus an undeclared dummy field, which must be stripped from the response. The separate validate-log fixture owns malformed response logging. No particular random article value is assumed.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this export and awaits it against the backend after generation; actual request transport is executed in the feature runtime program.
 * @evidence contracts/e2e.md#necessary-boundary The generated client and the configured manual or native response serializer must produce compatible wire data; direct serializer-source assertions cannot establish fetcher decoding.
 * @evidence contracts/e2e.md#shared-execution Four explicit callbacks use one DTO identity, compiler configuration, producer/runtime programs and real backend. They reuse one generated SDK and packed installation with the health/performance controls rather than preparing four duplicate projects.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The route creates independent random data and changes no retained fixture state; shape validation permits varying values. The feature entry owns its port and finally closes the backend on reports or discovery/startup failure.
 * @evidence contracts/e2e.md#preserved-coverage Former route-manual-assert/is/stringify/validate GET calls and exact DTO assertions execute once per retained callback here. Their identical void/performance checks remain once in this backend; malformed validate-log assertions retain their separate fixture.
 */
export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const errors: unknown[] = [];
  for (const [mode, random] of [
    ["assert", api.functional.route.random],
    ["is", api.functional.route.is.random_is],
    ["stringify", api.functional.route.stringify.random_stringify],
    ["validate", api.functional.route.validate.random_validate],
  ] as const) {
    try {
      const article: IBbsArticle = await random(connection);
      typia.assertEquals(article);
    } catch (error) {
      errors.push(
        new Error(`${mode}: manual serialization failed`, { cause: error }),
      );
    }
  }
  if (errors.length)
    throw new AggregateError(errors, "Manual route serialization cases failed");
};
