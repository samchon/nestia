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
