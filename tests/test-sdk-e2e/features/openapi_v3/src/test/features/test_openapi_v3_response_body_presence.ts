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
 * @evidence contracts/testing.md#behavioral-verification Generated void health success must remain declared with content undefined, while the article success retains an application/json schema.
 * @evidence contracts/testing.md#independent-expectations Authored void versus article return declarations establish body presence; OpenAPI3 content describes response payloads and must not promise a body for void.
 * @evidence contracts/testing.md#distinguishing-cases Empty and shaped success responses reject both unconditional schemaless media and dropping all media. The article schema is checked for presence, not complete semantics.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native return metadata and3.0 response composition must connect to final content fields; a successful2.0 downgrade alone cannot prove3.0 correctness.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
