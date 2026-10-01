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
 *
 * @evidence contracts/testing.md#behavioral-verification Void success200 and exception400 must stay declared with no schema, typed exception500 must have exactly type:string, and article success must retain a schema.
 * @evidence contracts/testing.md#independent-expectations Authored HealthController declares void success/exception and string exception, while the article route returns a payload. Swagger2 response representation independently requires these schema-presence distinctions.
 * @evidence contracts/testing.md#distinguishing-cases Void versus typed responses run on success and exception paths, rejecting both unconditional emission and wholesale body removal. The article schema is checked for presence rather than complete content.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native response/exception metadata and Swagger2 downgrade must produce the serialized response map; a request-body or ordinary3.x connection cannot substitute.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
