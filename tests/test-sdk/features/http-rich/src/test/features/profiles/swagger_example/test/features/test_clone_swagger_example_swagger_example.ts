import fs from "fs";
import typia, { OpenApi, tags } from "typia";

import { SwaggerExampleIBbsArticle } from "../../../../../../structures/swagger_example/IBbsArticle";

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
 * @evidence contracts/testing.md#behavioral-verification The original generated SDK documentation or Swagger assertions distinguish preserved multiline text, examples and version-specific body/form/encryption representation.
 * @evidence contracts/testing.md#independent-expectations Literal original JSDoc strings, authored DTO types and OpenAPI3/Swagger2 requirements establish every retained expectation independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases Success and request-body examples retain DTO shapes; named examples wrap values, parameter examples retain UUID format, and the create body retains its literal JSDoc description.
 * @evidence contracts/testing.md#execution-ownership The matching authored case is discovered in the shared installed consumer and reads the freshly generated document or SDK source from its owning profile.
 * @evidence contracts/e2e.md#necessary-boundary Actual native metadata, public SDK/Swagger generation and emitted documentation must agree; authored metadata units cannot establish the source-analysis connection.
 * @evidence contracts/e2e.md#shared-execution Both original document versions share one installed graph, producer, consumer and listener. Swagger2 excludes the same multiline controller and generates no SDK or automated cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate source metadata. Document versions have separate outputs; original controller JSDoc text and literal example-code references are retained.
 * @evidence contracts/e2e.md#preserved-coverage Every original type assertion, literal string and document lookup remains after reversible type/path/export identities; all four original cases run and no new random requests are introduced.
 */
export const test_clone_swagger_example_swagger_example =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(
        `${__dirname}/../../../../../../../profiles/swagger_example/swagger.json`,
        "utf-8",
      ),
    );
    typia.assert<OpenApi.IDocument>(swagger);

    // BbsArticlesController.create()
    typia.assert<{
      example: SwaggerExampleIBbsArticle;
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles"].post
        .responses["201"].content["application/json"],
    );
    typia.assert<{
      description: "Content to store";
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles"].post
        .requestBody,
    );
    typia.assert<{
      example: SwaggerExampleIBbsArticle.ICreate;
      examples: {
        x: { value: SwaggerExampleIBbsArticle.ICreate };
        y: { value: SwaggerExampleIBbsArticle.ICreate };
        z: { value: SwaggerExampleIBbsArticle.ICreate };
      };
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles"].post
        .requestBody.content["application/json"],
    );

    // BbsArticlesController.update()
    typia.assert<{
      example: SwaggerExampleIBbsArticle;
      examples: {
        a: { value: SwaggerExampleIBbsArticle };
        b: { value: SwaggerExampleIBbsArticle };
      };
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles/{id}"].put
        .responses["200"].content["application/json"],
    );
    typia.assert<{
      example: string & tags.Format<"uuid">;
      examples: {
        n: { value: string & tags.Format<"uuid"> };
      };
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles/{id}"].put
        .parameters[0],
    );
    typia.assert<{
      example: SwaggerExampleIBbsArticle.IUpdate;
    }>(
      swagger.paths["/http_rich/options/swagger_example/bbs/articles/{id}"].put
        .requestBody.content["application/json"],
    );
  };
