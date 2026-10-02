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
 *
 * @evidence contracts/testing.md#behavioral-verification Asserts the generated multiline route preserves tag name/description, throws text, security scopes and operation ID.
 * @evidence contracts/testing.md#independent-expectations Authored controller tag words and continuation text define exact literal expectations independently of generator output.
 * @evidence contracts/testing.md#distinguishing-cases First-word fields and multiline descriptions exercise distinct parsing responsibilities across four tag kinds.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-example/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-example controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-example feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-example test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_multiline_tags retain first-word fields and multiline descriptions exercise distinct parsing responsibilities across four tag kinds.
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
    "When nothing is found under the key it was asked for, even\nafter the fallback was consulted",
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
