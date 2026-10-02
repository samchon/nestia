import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed typed query is one required form/explode object
 * parameter.
 *
 * CLI route and DTO analysis must preserve object-query wire encoding in
 * OpenAPI metadata.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored expected query parameter is named query with the IQuery
 *    reference, required true, form style and explode true.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "query",
    {
      name: "query",
      in: "query",
      schema: { $ref: "#/components/schemas/IQuery" },
      required: true,
      style: "form",
      explode: true,
    },
    content.paths["/query/typed"].get.parameters.find(
      (p: any) => p.in === "query",
    )!,
  );
};
