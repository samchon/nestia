import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * 2. Walk every original component and operation member and collect nulls.
 * 3. Assert the only nulls are the declared `example`, `examples`, `x-empty`, and
 *    `x-nothing` values, and the non-finite `x-level` ones.
 * 4. Assert `any` becomes an empty schema, in the component and in a decomposed
 *    parameter.
 *
 * @evidence contracts/testing.md#behavioral-verification Only authored example/examples/x-empty/x-nothing and nonfinite x-level values may be null within every original parameter component and operation; any becomes an empty schema in component and parameter.
 * @evidence contracts/testing.md#independent-expectations The explicit full null-path list follows authored tags/plugin examples and JSON nonfinite semantics, while absent schema annotations are not instance values. Exact canonical empty schemas provide independent any expectations.
 * @evidence contracts/testing.md#distinguishing-cases Full recursive traversal contrasts legitimate instance/vendor nulls with absent schema fields, and component versus decomposed parameter any retain two locations.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_absent_schema_fields =
  async (): Promise<void> => {
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
    visit(SwaggerParameterReader.ownedNullView(document), "$");
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
            `$.paths./swagger_only/parameters/extension/non-finite.get.parameters[${i}].schema.x-level`,
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
          "/swagger_only/parameters/decompose/typed-query",
          "get",
        ).find((p) => p.name === "anything")?.schema,
      ),
      SwaggerParameterReader.canonical({}),
    );
  };
