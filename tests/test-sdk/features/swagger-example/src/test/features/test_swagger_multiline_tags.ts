import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies route tags whose text runs over lines are read by their first word.
 *
 * The SDK's JSDoc reader ended every tag at its first line, and now keeps the
 * lines after it, as TypeScript does. The readers of `@tag`, `@throws`,
 * `@security`, and `@operationId` split the text at spaces only, so the first
 * word ran into the next line's: a tag took the next line into its name, and so
 * did a security scheme, an operation id, or a status with nothing after it on
 * its line, which then vanished.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the route's tag and its description, the 404 response and its
 *    description, the security scopes, and the operation id.
 */
export const test_swagger_multiline_tags = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf-8"),
  );
  const operation: any = swagger.paths["/multiline"].get;
  TestValidator.equals("tags", operation.tags, ["Multiline"]);
  TestValidator.equals(
    "tag description",
    swagger.tags.find((tag: any) => tag.name === "Multiline")?.description,
    "Tags whose text runs over lines",
  );
  TestValidator.equals(
    "throws",
    operation.responses["404"]?.description,
    "When nothing is found under the key it was asked for, even\n  after the fallback was consulted",
  );
  TestValidator.equals("security", operation.security, [
    { bearer: ["read", "write"] },
  ]);
  TestValidator.equals(
    "operationId",
    operation.operationId,
    "readMultilineTags",
  );
};
