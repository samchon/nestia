import fs from "fs";
import typia, { OpenApi, tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies Swagger examples and JSDoc parameter descriptions survive SDK
 * metadata generation.
 *
 * The Go migration serializes SDK metadata before the TypeScript generator
 * composes OpenAPI request bodies and responses. This pins both decorator
 * examples and `@param input` request-body descriptions so native metadata
 * remains compatible with the TypeScript generator. A named example is an
 * OpenAPI Example Object holding the value under `value`; the document used to
 * carry the value itself, which tools read as an Example Object with no value
 * (#1649).
 *
 * 1. Read the generated Swagger document.
 * 2. Assert response, request-body, and path parameter examples on create/update
 *    routes, each named one wrapped as `{ value }`.
 * 3. Assert the create request body keeps its JSDoc `@param input` description.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated create/update responses, bodies and UUID parameter must contain declared example shapes with named examples under value; create body description remains Content to store.
 * @evidence contracts/testing.md#independent-expectations Authored decorators/DTOs and the named Example Object value field establish expected shapes. Example values are random and shape-checked rather than compared to a generated snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Default versus named examples, request versus response versus path parameter and distinct create/update DTOs retain all original assertions.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_example export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-example siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_example selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_swagger_example = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf-8"),
  );
  typia.assert<OpenApi.IDocument>(swagger);

  // BbsArticlesController.create()
  typia.assert<{
    example: IBbsArticle;
  }>(
    swagger.paths["/bbs/articles"].post.responses["201"].content[
      "application/json"
    ],
  );
  typia.assert<{
    description: "Content to store";
  }>(swagger.paths["/bbs/articles"].post.requestBody);
  typia.assert<{
    example: IBbsArticle.ICreate;
    examples: {
      x: { value: IBbsArticle.ICreate };
      y: { value: IBbsArticle.ICreate };
      z: { value: IBbsArticle.ICreate };
    };
  }>(
    swagger.paths["/bbs/articles"].post.requestBody.content["application/json"],
  );

  // BbsArticlesController.update()
  typia.assert<{
    example: IBbsArticle;
    examples: {
      a: { value: IBbsArticle };
      b: { value: IBbsArticle };
    };
  }>(
    swagger.paths["/bbs/articles/{id}"].put.responses["200"].content[
      "application/json"
    ],
  );
  typia.assert<{
    example: string & tags.Format<"uuid">;
    examples: {
      n: { value: string & tags.Format<"uuid"> };
    };
  }>(swagger.paths["/bbs/articles/{id}"].put.parameters[0]);
  typia.assert<{
    example: IBbsArticle.IUpdate;
  }>(
    swagger.paths["/bbs/articles/{id}"].put.requestBody.content[
      "application/json"
    ],
  );
};
