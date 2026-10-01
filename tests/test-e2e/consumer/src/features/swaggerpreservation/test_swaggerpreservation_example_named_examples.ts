import typia, { OpenApi, tags } from "typia";

import { IBbsArticle } from "../../oracle/swagger_only/examples/structures/IBbsArticle";
import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered and awaited by the existing installed rich consumer after native production and actual SDK/Swagger generation; failures reject its report.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution This case consumes existing shared generated artifacts and launches no installation, compiler, generator or application; document conversion uses an observation copy.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Actual document and SDK source reads are anchored to the rich sandbox; conversions copy the original owned operation scope and do not mutate shared output. The entry owns cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original literal descriptions, example DTO shapes, named/unnamed and present/absent controls remain executable here. Actual source exclusion, version-config dispatch and default-option connections remain pending; copied-document conversion does not certify them.
 */
export const test_swaggerpreservation_example_named_examples =
  async (): Promise<void> => {
    const swagger: any = await SwaggerParameterReader.document();
    typia.assert<OpenApi.IDocument>(swagger);

    // BbsArticlesController.create()
    typia.assert<{
      example: IBbsArticle;
    }>(
      swagger.paths["/swagger_only/examples/bbs/articles"].post.responses["201"]
        .content["application/json"],
    );
    typia.assert<{
      description: "Content to store";
    }>(swagger.paths["/swagger_only/examples/bbs/articles"].post.requestBody);
    typia.assert<{
      example: IBbsArticle.ICreate;
      examples: {
        x: { value: IBbsArticle.ICreate };
        y: { value: IBbsArticle.ICreate };
        z: { value: IBbsArticle.ICreate };
      };
    }>(
      swagger.paths["/swagger_only/examples/bbs/articles"].post.requestBody
        .content["application/json"],
    );

    // BbsArticlesController.update()
    typia.assert<{
      example: IBbsArticle;
      examples: {
        a: { value: IBbsArticle };
        b: { value: IBbsArticle };
      };
    }>(
      swagger.paths["/swagger_only/examples/bbs/articles/{id}"].put.responses[
        "200"
      ].content["application/json"],
    );
    typia.assert<{
      example: string & tags.Format<"uuid">;
      examples: {
        n: { value: string & tags.Format<"uuid"> };
      };
    }>(
      swagger.paths["/swagger_only/examples/bbs/articles/{id}"].put
        .parameters[0],
    );
    typia.assert<{
      example: IBbsArticle.IUpdate;
    }>(
      swagger.paths["/swagger_only/examples/bbs/articles/{id}"].put.requestBody
        .content["application/json"],
    );
  };
