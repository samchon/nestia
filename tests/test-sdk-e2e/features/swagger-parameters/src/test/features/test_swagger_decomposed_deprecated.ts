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
 * @evidence contracts/testing.md#behavioral-verification Declared page and x-legacy parameters must exist and alone carry deprecated:true; every other emitted parameter has undefined deprecated.
 * @evidence contracts/testing.md#independent-expectations Authored deprecated property tags independently identify page and x-legacy, with positive presence assertions preventing an empty parameter list from passing.
 * @evidence contracts/testing.md#distinguishing-cases Query versus header and tagged versus untagged properties contrast deprecation propagation; both required owner names are pinned.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_deprecated export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_deprecated documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_decomposed_deprecated = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  for (const [path, deprecated] of [
    ["/example/query", "page"],
    ["/decompose/typed-headers", "x-legacy"],
  ] as const) {
    const parameters = SwaggerParameterReader.parameters(document, path, "get");
    TestValidator.equals(
      `${path} deprecated property exists`,
      parameters.some((p) => p.name === deprecated),
      true,
    );
    for (const p of parameters)
      TestValidator.equals(
        `${path} ${p.name} deprecated`,
        p.deprecated,
        p.name === deprecated ? true : undefined,
      );
  }
};
