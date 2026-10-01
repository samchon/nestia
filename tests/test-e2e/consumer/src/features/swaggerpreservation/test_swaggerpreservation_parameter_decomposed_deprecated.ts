import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_deprecated =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    for (const [path, deprecated] of [
      ["/swagger_only/parameters/example/query", "page"],
      ["/swagger_only/parameters/decompose/typed-headers", "x-legacy"],
    ] as const) {
      const parameters = SwaggerParameterReader.parameters(
        document,
        path,
        "get",
      );
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
