import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_property_set =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    for (const [component, paths] of [
      [
        "IDecomposeQuery",
        [
          "/swagger_only/parameters/decompose/typed-query",
          "/swagger_only/parameters/decompose/nest-query",
        ],
      ],
      [
        "IDecomposeHeaders",
        [
          "/swagger_only/parameters/decompose/typed-headers",
          "/swagger_only/parameters/decompose/nest-headers",
        ],
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
