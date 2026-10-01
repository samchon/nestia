import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated /status/random response300 must refer exactly to components.schemas.IBbsArticle.
 * @evidence contracts/testing.md#independent-expectations The authored response status/type establish the literal300 key and canonical declared type reference.
 * @evidence contracts/testing.md#distinguishing-cases A specific nondefault response key and schema ref cannot be satisfied by default200 alone; other responses are not constrained.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_swagger after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorator/tag metadata must reach the final serialized Swagger document; an isolated DTO or declaration inspection cannot certify operation security/status output.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and the same generated document rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The read resolves from this emitted case to its own generated document. Local sorted security representations do not mutate the document; the feature/backend and copied outputs have entry/harness owners.
 * @evidence contracts/e2e.md#preserved-coverage The test_swagger selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
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
