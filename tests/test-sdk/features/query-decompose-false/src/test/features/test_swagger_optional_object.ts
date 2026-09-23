import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed query object is required only when the request must
 * send one of its keys.
 *
 * With `decompose: false` the whole DTO is one query parameter, which used to
 * take `required` from the handler parameter alone. A DTO whose properties are
 * all optional is satisfied by an empty query string, so marking it required
 * made Swagger UI and request validators demand a value the endpoint does not
 * need. The rule counts only the keys the document describes, holds for every
 * member of a union of objects, and leaves a field-named parameter, which is
 * one query key of its own, as declared.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the all-optional DTO, a union with an all-optional member, and a DTO
 *    whose only required property is `@ignore`d are not required.
 * 3. Assert the DTO with a required property and a field-named object parameter
 *    are required.
 */
export const test_swagger_optional_object = async (): Promise<void> => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const required = (path: string): boolean | undefined =>
    content.paths[path].get.parameters.find((p: any) => p.in === "query")
      ?.required;
  TestValidator.equals("optional", required("/query/optional"), false);
  TestValidator.equals("union", required("/query/union"), false);
  TestValidator.equals("ignored", required("/query/ignored"), false);
  TestValidator.equals("typed", required("/query/typed"), true);
  TestValidator.equals("field", required("/query/field"), true);
};
