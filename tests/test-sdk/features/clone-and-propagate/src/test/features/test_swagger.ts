import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies checks the generated 202 JSON response references IUser.
 *
 * The authored getUserProfile response is IUser at status 202; OpenAPI local
 * references use the components/schemas prefix.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const route = content.paths["/users/{user_id}/user"].get;

  TestValidator.equals(
    "202",
    route.responses["202"].content["application/json"].schema.$ref,
    "#/components/schemas/IUser",
  );
};
