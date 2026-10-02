import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Reads generated status/random response and asserts status 300 has an
 * IBbsArticle JSON schema reference.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const route = content.paths["/status/random"].get;

  TestValidator.equals(
    "300",
    route.responses["300"].content["application/json"].schema.$ref,
    "#/components/schemas/IBbsArticle",
  );
};
