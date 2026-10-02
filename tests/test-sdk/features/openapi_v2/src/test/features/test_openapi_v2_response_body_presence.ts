import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a Swagger 2.0 response declares a schema exactly when it has a body.
 *
 * Why: the sibling case only asserts the emitted document is a legal 2.0
 * document, so it proves generation survived rather than what it produced. The
 * predicate deciding whether to write the media type governs the success
 * response and every declared exception alike, and its regression is quiet in
 * both directions: the document stays legal at 3.x, and only the 2.0 downgrade
 * refuses a media type that promises a body which never arrives.
 *
 * 1. Read the generated 2.0 document.
 * 2. Assert the `void` route and its `void` exception declare no schema while both
 *    responses stay declared.
 * 3. Assert the typed exception beside that `void` one still declares its schema,
 *    so a composer that dropped every exception body would not pass.
 * 4. Assert a route returning a real payload still declares one, so the same twin
 *    holds for the success response.
 */
export const test_openapi_v2_response_body_presence =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    const health: any = swagger.paths["/health"].get.responses;
    TestValidator.predicate(
      "void success response is declared",
      health["200"] !== undefined,
    );
    TestValidator.equals(
      "void success declares no schema",
      health["200"].schema,
      undefined,
    );
    TestValidator.predicate(
      "void exception response is declared",
      health["400"] !== undefined,
    );
    TestValidator.equals(
      "void exception declares no schema",
      health["400"].schema,
      undefined,
    );
    TestValidator.equals(
      "typed exception keeps its schema",
      health["500"].schema,
      {
        type: "string",
      },
    );

    const articles: any =
      swagger.paths["/bbs/{section}/articles"].get.responses["200"];
    TestValidator.predicate(
      "payload response declares a schema",
      articles.schema !== undefined,
    );
  };
