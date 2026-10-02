import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies decomposition emits exactly the properties typia's object schema
 * describes.
 *
 * The decomposed parameters must be exactly the properties the object schema
 * typia writes describes: the same names, in declaration order, with matching
 * required flags. typia drops `@internal` members from the metadata itself and
 * `@hidden` and `@ignore` members from the schema, so none of them may become a
 * parameter. The formatter rewrites `@hidden` to `@ignore` in these sources, so
 * `@hidden` is pinned by the SDK's Go tests instead.
 *
 * 1. Read the generated Swagger document.
 * 2. For each decomposed route, compare parameter names and required flags with
 *    the component's properties and required list.
 * 3. Assert the `@internal` and `@ignore` members appear nowhere.
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
      for (const omitted of ["internal", "ignored", "x-internal"])
        TestValidator.equals(
          `${path} omits ${omitted}`,
          parameters.some((p) => p.name === omitted),
          false,
        );
    }
  }
};
