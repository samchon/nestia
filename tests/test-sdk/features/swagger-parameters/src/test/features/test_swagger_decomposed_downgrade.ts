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
