import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a query object with a dynamic key yields only its known keys in a
 * Swagger 2.0 document.
 *
 * Why: OpenAPI 3.x documents such an object as one form-style parameter that
 * explodes into arbitrary keys (#1645), but Swagger 2.0 has no object query
 * parameter; its downgrader would turn one into a `$ref` parameter, which 2.0
 * reads as a reference to a whole parameter definition. So for 2.0 the known
 * keys become parameters and the dynamic part, which 2.0 cannot describe, is
 * left out.
 *
 * 1. Read the generated 2.0 document.
 * 2. Assert the mixed query object yields its known `keyword` parameter only.
 * 3. Assert the pure-`Record` query object yields no parameter.
 */
export const test_openapi_v2_dynamic_query = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const summary = (path: string): string[] =>
    ((swagger.paths[path].get.parameters ?? []) as any[]).map(
      (p) => `${p.in}:${p.name}:${p.type}`,
    );
  TestValidator.equals("mixed", summary("/search/mixed"), [
    "query:keyword:string",
  ]);
  TestValidator.equals("record", summary("/search/record"), []);
};
