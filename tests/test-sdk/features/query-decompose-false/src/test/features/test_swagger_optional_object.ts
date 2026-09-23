import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed query object is required only when one of its keys
 * is.
 *
 * With `decompose: false` the whole DTO is one query parameter, which used to
 * take `required` from the handler parameter alone. A DTO whose properties are
 * all optional is satisfied by an empty query string, so marking it required
 * made Swagger UI and request validators demand a value the endpoint does not
 * need. The twin is a DTO with a required property, which stays required.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the all-optional DTO's parameter is not required.
 * 3. Assert the DTO with a required property is still required.
 */
export const test_swagger_optional_object = async (): Promise<void> => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const required = (path: string): boolean | undefined =>
    content.paths[path].get.parameters.find((p: any) => p.in === "query")
      ?.required;
  TestValidator.equals("optional", required("/query/optional"), false);
  TestValidator.equals("typed", required("/query/typed"), true);
};
