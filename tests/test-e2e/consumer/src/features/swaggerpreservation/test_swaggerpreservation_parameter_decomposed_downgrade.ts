import { TestValidator } from "@nestia/e2e";
import { OpenApiConverter } from "@typia/utils";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#behavioral-verification 3.1/3.0/2.0 downgrades must retain selected date/range/default/integer/UUID-array/template constraints and field header UUID;3.x keeps deprecated.
 * @evidence contracts/testing.md#independent-expectations Authored type tags prescribe exact date-time,1/100/10,integer,UUID,minItems1 values. Explicit lookup fails missing keys; template only requires a string pattern, not exact regex.
 * @evidence contracts/testing.md#distinguishing-cases Inline2.0 schema versus3.x schema object, three versions and query versus field-header controls retain representation boundaries;2.0 deprecation omission is owned elsewhere.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_downgrade =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    for (const version of ["3.1", "3.0", "2.0"] as const) {
      const source: OpenApi.IDocument =
        SwaggerParameterReader.parameterConversionView(document);
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
        parameter("/swagger_only/parameters/decompose/typed-query", name);

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
            downgraded.paths["/swagger_only/parameters/example/query"].get
              .parameters as any[]
          ).find((p) => p.name === "page")?.deprecated,
          true,
        );
      TestValidator.equals(
        `${version} field header`,
        parameter("/swagger_only/parameters/field/{id}", "x-trace").format,
        "uuid",
      );
    }
  };
