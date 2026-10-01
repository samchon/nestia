import { TestValidator } from "@nestia/e2e";
import { OpenApiConverter } from "@typia/utils";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_downgrade export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_downgrade documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_decomposed_downgrade = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
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
      parameter("/decompose/typed-query", name);

    TestValidator.equals(`${version} from`, query("from").format, "date-time");
    TestValidator.equals(`${version} limit minimum`, query("limit").minimum, 1);
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
        (downgraded.paths["/example/query"].get.parameters as any[]).find(
          (p) => p.name === "page",
        )?.deprecated,
        true,
      );
    TestValidator.equals(
      `${version} field header`,
      parameter("/field/{id}", "x-trace").format,
      "uuid",
    );
  }
};
