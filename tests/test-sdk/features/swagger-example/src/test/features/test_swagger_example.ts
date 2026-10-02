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
 * @evidence contracts/testing.md#behavioral-verification Asserts generated response, request-body and parameter examples satisfy the authored DTO types, named examples wrap value and body descriptions survive.
 * @evidence contracts/testing.md#independent-expectations Authored SwaggerExample decorations and the DTO contract establish example shapes; OpenAPI named Example Objects hold data in value.
 * @evidence contracts/testing.md#distinguishing-cases Create/update examples, request descriptions and named versus unnamed examples distinguish dropped metadata and missing value wrappers.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-example/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-example controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-example feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-example test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_example retain create/update examples, request descriptions and named versus unnamed examples distinguish dropped metadata and missing value wrappers.
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
