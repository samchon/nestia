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
 *
 * @evidence contracts/testing.md#behavioral-verification Each typed/plain query/header parameter list must exactly match component names/order/requiredness and omit internal/ignored/x-internal; both component key sets are independently pinned.
 * @evidence contracts/testing.md#independent-expectations Handwritten25 query and8 header property names follow authored declarations. Component required flags are a consistency oracle, supplemented by explicit omitted keys and named schema controls elsewhere.
 * @evidence contracts/testing.md#distinguishing-cases Typed versus plain and query versus header retain four route controls; optional page/header keys contrast required fields, and positive complete key pins prevent both sides being empty.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_property_set export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_property_set documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
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
    TestValidator.equals(
      `${component} declared properties`,
      Object.keys(schema.properties ?? {}),
      component === "IDecomposeQuery"
        ? [
            "from",
            "limit",
            "int32",
            "page",
            "pattern",
            "length",
            "multiple",
            "ids",
            "tpl",
            "prefixed",
            "literal",
            "kind",
            "nullable",
            "flag",
            "big",
            "commentFormat",
            "commentMinimum",
            "values",
            "generic",
            "readonlyProp",
            "described",
            "plugin",
            "example",
            "anything",
            "custom",
          ]
        : [
            "x-from",
            "x-limit",
            "x-int32",
            "x-ids",
            "x-tpl",
            "x-literal",
            "x-flag",
            "x-legacy",
          ],
    );
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
