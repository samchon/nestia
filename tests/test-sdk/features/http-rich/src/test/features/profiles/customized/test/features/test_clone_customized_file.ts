import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { OpenApi } from "typia";

/**
 * Reads generated Swagger and checks the customizer description, selected
 * original route and emitted OpenAPI version.
 *
 * @evidence contracts/testing.md#behavioral-verification The original OpenAPI version, custom description and selected neighbor method/path literals must remain exact.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases The original OpenAPI version, custom description and selected neighbor method/path literals must remain exact.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The actual installed customizer registration, neighbor lookup and Swagger writer must preserve the original version, description and selected route identity in emitted JSON.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../../../../../profiles/customized/swagger.json`,
    "utf8",
  );
  const swagger: OpenApi.IDocument = JSON.parse(content);
  const route: OpenApi.IOperation =
    swagger.paths![
      "/http_rich/options/customized/custom/{key}/{value}/customize"
    ]!.get!;

  TestValidator.equals("swagger.openapi", swagger.openapi, "3.2.11");
  TestValidator.equals(
    "route.description",
    route.description,
    "This is a custom description",
  );
  TestValidator.equals(`route["x-selector"]`, (route as any)["x-selector"], {
    method: "get",
    path: "/http_rich/options/customized/custom/{id}/normal",
  });
};
