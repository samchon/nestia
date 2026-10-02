import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies the document omits the schema fields typia leaves absent, and keeps
 * the nulls that are real values.
 *
 * An absent field is a Go nil in typia's writer: an undocumented constant has a
 * nil `title` and `description`, and `any` has a nil `type`. The SDK used to
 * serialize those as JSON null (#1640), which JSON Schema rejects. A null
 * inside instance data or a vendor extension is the negative twin: it is the
 * value the user declared, so it must stay. `tags.Example<null>` is one; the
 * typia linked before #1646 dropped it entirely. A JSDoc `@x-nothing null` is
 * another, and typia still writes that one as a bare nil. So is an `@x-` value
 * that reads as a non-finite number, which JSON can only write as null
 * (#1655).
 *
 * 1. Read the generated Swagger document.
 * 2. Walk every member and collect the ones that are null.
 * 3. Assert the only nulls are the declared `example`, `examples`, `x-empty`, and
 *    `x-nothing` values, and the non-finite `x-level` ones.
 * 4. Assert `any` becomes an empty schema, in the component and in a decomposed
 *    parameter.
 *
 * @evidence contracts/testing.md#behavioral-verification Recursively enumerates generated null members and checks exact allowed instance/vendor null paths plus empty schemas for any.
 * @evidence contracts/testing.md#independent-expectations Absent JSON Schema annotations must be omitted, while explicit null examples and non-finite vendor values retain JSON null semantics.
 * @evidence contracts/testing.md#distinguishing-cases Undocumented fields and any are negative controls against explicit null examples, null extensions and non-finite extensions.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_absent_schema_fields retain undocumented fields and any are negative controls against explicit null examples, null extensions and non-finite extensions.
 */
export const test_swagger_absent_schema_fields = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const nulls: string[] = [];
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value))
      value.forEach((element, i) => visit(element, `${path}[${i}]`));
    else if (typeof value === "object" && value !== null)
      for (const [key, member] of Object.entries(value))
        if (member === null) nulls.push(`${path}.${key}`);
        else visit(member, `${path}.${key}`);
  };
  visit(document, "$");
  const nonFinite: string[] = ["nan", "infinity", "negative", "short"];
  TestValidator.equals(
    "null members",
    nulls.sort(),
    [
      "$.components.schemas.IAbsentFields.properties.jsdoc.x-nothing",
      "$.components.schemas.IAbsentFields.properties.named.examples.none",
      "$.components.schemas.IAbsentFields.properties.plugin.x-empty",
      "$.components.schemas.IAbsentFields.properties.single.example",
      ...nonFinite.map(
        (key) =>
          `$.components.schemas.INonFiniteExtensions.properties.${key}.x-level`,
      ),
      ...nonFinite.map(
        (_key, i) =>
          `$.paths./extension/non-finite.get.parameters[${i}].schema.x-level`,
      ),
    ].sort(),
  );

  const component = document.components.schemas![
    "IAbsentFields"
  ] as OpenApi.IJsonSchema.IObject;
  TestValidator.equals(
    "component any",
    SwaggerParameterReader.canonical(component.properties?.anything),
    SwaggerParameterReader.canonical({}),
  );
  TestValidator.equals(
    "parameter any",
    SwaggerParameterReader.canonical(
      SwaggerParameterReader.parameters(
        document,
        "/decompose/typed-query",
        "get",
      ).find((p) => p.name === "anything")?.schema,
    ),
    SwaggerParameterReader.canonical({}),
  );
};
