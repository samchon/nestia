import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an OpenAPI 3.0 response carries `content` exactly when it has a
 * body.
 *
 * Why: omitting the media type for a bodyless response is the document being
 * correct, not a workaround for the 2.0 downgrade that first surfaced it. At
 * 3.x nothing refuses the document, so the defect is silent here: a client
 * generator reads `content: { "application/json": {} }` as a body and emits a
 * parse for one that never arrives. This is the twin that keeps the rule from
 * being narrowed to the version that complains.
 *
 * 1. Read the generated 3.0 document.
 * 2. Assert the `void` route's response is declared and carries no `content`.
 * 3. Assert a route returning a real payload still carries its media type and
 *    schema.
 *
 * @evidence contracts/testing.md#behavioral-verification The void success remains declared without content, while the articles payload success retains an application/json schema.
 * @evidence contracts/testing.md#independent-expectations The authored return types distinguish bodyless void from real payload; OpenAPI 3.0 describes bodies through media-type content.
 * @evidence contracts/testing.md#distinguishing-cases Adjacent bodyless and payload successes distinguish correct omission from erasing all response media types.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary Controller return metadata must connect to response composition and the 3.0 output; legal document shape alone would not distinguish invented empty content.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
 */
export const test_openapi_v3_response_body_presence =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    const health: any = swagger.paths["/health"].get.responses["200"];
    TestValidator.predicate(
      "void success response is declared",
      health !== undefined,
    );
    TestValidator.equals(
      "void success carries no content",
      health.content,
      undefined,
    );

    const articles: any =
      swagger.paths["/bbs/{section}/articles"].get.responses["200"];
    TestValidator.predicate(
      "payload response carries its schema",
      articles.content?.["application/json"]?.schema !== undefined,
    );
  };
