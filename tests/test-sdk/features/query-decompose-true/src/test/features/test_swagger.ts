import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies decomposed query documentation lists individual fields with distinct
 * requiredness.
 *
 * The CLI decomposition policy must compose native property metadata into
 * request parameters.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored ordered names are limit, enforce, values and atomic;
 *    limit is optional while enforce is required.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const queries: any[] = content.paths["/query/typed"].get.parameters.filter(
    (p: any) => p.in === "query",
  );

  TestValidator.equals(
    "queries",
    queries.map((q) => q.name),
    ["limit", "enforce", "values", "atomic"],
  );
  TestValidator.equals(
    "not required",
    queries.find((q) => q.name === "limit")?.required,
    false,
  );
  TestValidator.equals(
    "required",
    queries.find((q) => q.name === "enforce")?.required,
    true,
  );
};
