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
 * @evidence contracts/testing.md#behavioral-verification Checks decomposed query/header names and required flags against emitted object schemas and explicitly rejects visibility-marked members.
 * @evidence contracts/testing.md#independent-expectations Authored visibility tags establish omitted names; component/parameter agreement verifies projection but remains limited if both producers omit the same visible property.
 * @evidence contracts/testing.md#distinguishing-cases Typed and vanilla query/header routes compare complete ordered name sets, optionality and internal/ignored negative controls.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_property_set retain typed and vanilla query/header routes compare complete ordered name sets, optionality and internal/ignored negative controls.
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
