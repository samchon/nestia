import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies decomposition emits exactly the properties typia's object schema
 * describes.
 *
 * The object schema typia writes omits `@internal`, `@hidden`, and `@ignore`
 * members. Decomposition used to omit only the latter two, so an `@internal`
 * member that `decompose: false` keeps out of the document still surfaced as a
 * public parameter. The decomposed parameter names must equal the component's
 * property names, in declaration order, with matching required flags.
 *
 * 1. Read the generated Swagger document.
 * 2. For each decomposed route, compare parameter names and required flags with
 *    the component's properties and required list.
 * 3. Assert the `@internal`, `@hidden`, and `@ignore` members appear nowhere.
 */
export const test_swagger_decomposed_property_set = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  for (const [component, paths] of [
    ["IDecomposeQuery", ["/decompose/typed-query", "/decompose/nest-query"]],
    [
      "IDecomposeHeaders",
      ["/decompose/typed-headers", "/decompose/nest-headers"],
    ],
  ] as const) {
    const schema = document.components.schemas![
      component
    ] as OpenApi.IJsonSchema.IObject;
    for (const path of paths) {
      const parameters: SwaggerParameterReader.IParameter[] =
        SwaggerParameterReader.parameters(document, path, "get");
      TestValidator.equals(
        `${path} names`,
        parameters.map((p) => p.name),
        Object.keys(schema.properties ?? {}),
      );
      TestValidator.equals(
        `${path} required`,
        parameters.filter((p) => p.required).map((p) => p.name),
        schema.required,
      );
      for (const omitted of ["internal", "hidden", "ignored", "x-internal"])
        TestValidator.equals(
          `${path} omits ${omitted}`,
          parameters.some((p) => p.name === omitted),
          false,
        );
    }
  }
};
