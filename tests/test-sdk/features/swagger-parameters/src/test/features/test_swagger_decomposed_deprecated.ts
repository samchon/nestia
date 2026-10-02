import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies a decomposed parameter is deprecated exactly when its property is.
 *
 * A `@deprecated` property gets `deprecated: true` in typia's object schema,
 * and OpenAPI defines the same field on the Parameter Object. Decomposition
 * used to drop it (#1642), so the deprecation that `decompose: false` documents
 * vanished once the object was split.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the deprecated query and header properties become deprecated
 *    parameters.
 * 3. Assert every other decomposed parameter carries no `deprecated` field.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks query and header parameters are deprecated only for the named deprecated authored properties.
 * @evidence contracts/testing.md#independent-expectations The property deprecated annotation maps to Parameter Object deprecated; unmarked properties must omit it.
 * @evidence contracts/testing.md#distinguishing-cases Named deprecated query/header positives are paired with every other parameter as a negative control.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_deprecated retain named deprecated query/header positives are paired with every other parameter as a negative control.
 */
export const test_swagger_decomposed_deprecated = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  for (const [path, deprecated] of [
    ["/example/query", "page"],
    ["/decompose/typed-headers", "x-legacy"],
  ] as const)
    for (const p of SwaggerParameterReader.parameters(document, path, "get"))
      TestValidator.equals(
        `${path} ${p.name} deprecated`,
        p.deprecated,
        p.name === deprecated ? true : undefined,
      );
};
