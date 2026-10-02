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
