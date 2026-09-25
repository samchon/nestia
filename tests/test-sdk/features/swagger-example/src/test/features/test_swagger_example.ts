import fs from "fs";
import typia, { OpenApi, tags } from "typia";

import { IBbsArticle } from "../../api/structures/IBbsArticle";

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
