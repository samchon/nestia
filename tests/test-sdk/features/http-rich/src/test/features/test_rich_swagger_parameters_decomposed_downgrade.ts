import { TestValidator } from "@nestia/e2e";
import { OpenApiConverter } from "@typia/utils";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

/**
 * Verifies decomposed and field parameters keep their constraints in every
 * `swagger.openapi` version.
 *
 * `nestia swagger` and `NestiaSwaggerComposer` both write the 3.2 document and
 * hand it to `OpenApiConverter.downgradeDocument` for an older version. The
 * constraints the decomposed parameters now carry and the field header must
 * survive that conversion, including Swagger 2.0, whose parameters inline their
 * schema. The deprecation flag must survive into 3.x; Swagger 2.0 has no
 * parameter `deprecated`, and the generator leaves it out when it targets 2.0,
 * which the `openapi_v2` feature pins.
 *
 * 1. Read the generated 3.2 document and downgrade it to 3.1, 3.0, and 2.0.
 * 2. In each version, assert the format, range, integer, array, and pattern
 *    constraints of the decomposed query parameters and the field header.
 * 3. Assert the deprecated parameter survives into 3.1 and 3.0.
 *
 * @evidence contracts/testing.md#behavioral-verification The original 3.1/3.0/2.0 conversions retain literal query format/ranges/default/integer/array/template and field-header UUID constraints, with deprecation retained in 3.x.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases The original 3.1/3.0/2.0 conversions retain literal query format/ranges/default/integer/array/template and field-header UUID constraints, with deprecation retained in 3.x.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage The original 3.1/3.0/2.0 conversions retain literal query format/ranges/default/integer/array/template and field-header UUID constraints, with deprecation retained in 3.x. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_decomposed_downgrade =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    for (const version of ["3.1", "3.0", "2.0"] as const) {
      const source: OpenApi.IDocument = JSON.parse(JSON.stringify(document));
      // Swagger 2.0 has no server description, so the generator leaves its
      // placeholder server undescribed when `swagger.openapi` is "2.0".
      if (version === "2.0")
        source.servers = source.servers?.map((server) => ({ url: server.url }));
      const downgraded: any = OpenApiConverter.downgradeDocument(
        source,
        version as "3.0",
      );
      const parameter = (path: string, name: string): any => {
        const found = (downgraded.paths[path].get.parameters as any[]).find(
          (p) => p.name === name,
        );
        if (found === undefined)
          throw new Error(`${version} ${path} lost parameter ${name}.`);
        // Swagger 2.0 inlines a non-body parameter's schema into the parameter.
        return version === "2.0" ? found : found.schema;
      };
      const query = (name: string): any =>
        parameter("/http_rich/swagger_parameters/decompose/typed-query", name);

      TestValidator.equals(
        `${version} from`,
        query("from").format,
        "date-time",
      );
      TestValidator.equals(
        `${version} limit minimum`,
        query("limit").minimum,
        1,
      );
      TestValidator.equals(
        `${version} limit maximum`,
        query("limit").maximum,
        100,
      );
      TestValidator.equals(
        `${version} limit default`,
        query("limit").default,
        10,
      );
      TestValidator.equals(`${version} int32`, query("int32").type, "integer");
      TestValidator.equals(
        `${version} ids items`,
        query("ids").items.format,
        "uuid",
      );
      TestValidator.equals(`${version} ids minItems`, query("ids").minItems, 1);
      TestValidator.equals(
        `${version} tpl pattern`,
        typeof query("tpl").pattern,
        "string",
      );
      if (version !== "2.0")
        TestValidator.equals(
          `${version} deprecated`,
          (
            downgraded.paths["/http_rich/swagger_parameters/example/query"].get
              .parameters as any[]
          ).find((p) => p.name === "page")?.deprecated,
          true,
        );
      TestValidator.equals(
        `${version} field header`,
        parameter("/http_rich/swagger_parameters/field/{id}", "x-trace").format,
        "uuid",
      );
    }
  };
