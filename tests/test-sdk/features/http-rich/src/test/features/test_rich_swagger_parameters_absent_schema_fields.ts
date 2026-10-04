import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification The complete scenario schema/path projection permits only the original literal null members, while both component and decomposed any schemas remain empty objects.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases The complete scenario schema/path projection permits only the original literal null members, while both component and decomposed any schemas remain empty objects.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage The complete scenario schema/path projection permits only the original literal null members, while both component and decomposed any schemas remain empty objects. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_absent_schema_fields =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
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
            `$.paths./http_rich/swagger_parameters/extension/non-finite.get.parameters[${i}].schema.x-level`,
        ),
      ].sort(),
    );

    const component = document.components.schemas![
      "IAbsentFields"
    ] as OpenApi.IJsonSchema.IObject;
    TestValidator.equals(
      "component any",
      RichSwaggerParameterReader.canonical(component.properties?.anything),
      RichSwaggerParameterReader.canonical({}),
    );
    TestValidator.equals(
      "parameter any",
      RichSwaggerParameterReader.canonical(
        RichSwaggerParameterReader.parameters(
          document,
          "/http_rich/swagger_parameters/decompose/typed-query",
          "get",
        ).find((p) => p.name === "anything")?.schema,
      ),
      RichSwaggerParameterReader.canonical({}),
    );
  };
