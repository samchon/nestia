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
 * @evidence contracts/testing.md#behavioral-verification Only authored example/examples/x-empty/x-nothing and nonfinite x-level values may be null anywhere in the document; any becomes an empty schema in component and parameter.
 * @evidence contracts/testing.md#independent-expectations The explicit full null-path list follows authored tags/plugin examples and JSON nonfinite semantics, while absent schema annotations are not instance values. Exact canonical empty schemas provide independent any expectations.
 * @evidence contracts/testing.md#distinguishing-cases Full recursive traversal contrasts legitimate instance/vendor nulls with absent schema fields, and component versus decomposed parameter any retain two locations.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_absent_schema_fields export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_absent_schema_fields documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
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
