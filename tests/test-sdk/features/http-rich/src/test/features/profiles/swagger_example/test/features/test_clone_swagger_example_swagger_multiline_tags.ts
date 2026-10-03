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
 * @evidence contracts/testing.md#behavioral-verification The original generated SDK documentation or Swagger assertions distinguish preserved multiline text, examples and version-specific body/form/encryption representation.
 * @evidence contracts/testing.md#independent-expectations Literal original JSDoc strings, authored DTO types and OpenAPI3/Swagger2 requirements establish every retained expectation independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases The exact multiline tag description, throws description including its newline, bearer read/write scopes and first-word operation ID must survive continued JSDoc lines.
 * @evidence contracts/testing.md#execution-ownership The matching authored case is discovered in the shared installed consumer and reads the freshly generated document or SDK source from its owning profile.
 * @evidence contracts/e2e.md#necessary-boundary Actual native metadata, public SDK/Swagger generation and emitted documentation must agree; authored metadata units cannot establish the source-analysis connection.
 * @evidence contracts/e2e.md#shared-execution Both original document versions share one installed graph, producer, consumer and listener. Swagger2 excludes the same multiline controller and generates no SDK or automated cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate source metadata. Document versions have separate outputs; original controller JSDoc text and literal example-code references are retained.
 * @evidence contracts/e2e.md#preserved-coverage Every original type assertion, literal string and document lookup remains after reversible type/path/export identities; all four original cases run and no new random requests are introduced.
 */
export const test_clone_swagger_example_swagger_multiline_tags =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(
        `${__dirname}/../../../../../../../profiles/swagger_example/swagger.json`,
        "utf-8",
      ),
    );
    const operation: any =
      swagger.paths["/http_rich/options/swagger_example/multiline"].get;
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
