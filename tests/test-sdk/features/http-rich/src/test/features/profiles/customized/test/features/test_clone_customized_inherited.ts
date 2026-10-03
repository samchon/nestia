import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import {
  RichInheritedSwaggerController,
  RichInheritedSwaggerControllerBase,
} from "../../../../../../controllers/options/customized/RichSwaggerController";

/**
 * Checks decorator examples and generated customizer extensions remain
 * separated between base, derived and inherited routes.
 *
 * @evidence contracts/testing.md#behavioral-verification Base and derived own examples remain distinct; inherited examples/customizers remain inherited, and opposite own customizer extensions must be absent.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases Base and derived own examples remain distinct; inherited examples/customizers remain inherited, and opposite own customizer extensions must be absent.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorator inheritance and installed Swagger composition must keep base, derived and inherited customizers/examples distinct in the emitted routes and reflection metadata.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_inherited = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../../../../../../profiles/customized/swagger.json`,
      "utf8",
    ),
  );
  const base: any =
    swagger.paths["/http_rich/options/customized/custom/inheritance/base/route"]
      .get;
  const derived: any =
    swagger.paths[
      "/http_rich/options/customized/custom/inheritance/derived/route"
    ].get;
  const inherited: any =
    swagger.paths[
      "/http_rich/options/customized/custom/inheritance/derived/inherited"
    ].get;
  const baseExamples: Array<{ example: string }> = Reflect.getOwnMetadata(
    "nestia/SwaggerExample/Parameters",
    RichInheritedSwaggerControllerBase.prototype,
    "example",
  );
  const derivedExamples: Array<{ example: string }> = Reflect.getOwnMetadata(
    "nestia/SwaggerExample/Parameters",
    RichInheritedSwaggerController.prototype,
    "example",
  );
  const inheritedExamples: Array<{ example: string }> = Reflect.getMetadata(
    "nestia/SwaggerExample/Parameters",
    RichInheritedSwaggerController.prototype,
    "inheritedExample",
  );

  TestValidator.equals(
    "base parameter example metadata",
    baseExamples[0]?.example,
    "base",
  );
  TestValidator.equals(
    "derived parameter example metadata",
    derivedExamples[0]?.example,
    "derived",
  );
  TestValidator.equals(
    "inherited parameter example metadata",
    inheritedExamples[0]?.example,
    "inherited",
  );
  TestValidator.equals("base customizer", base["x-metadata-base"], true);
  TestValidator.equals(
    "base excludes derived customizer",
    base["x-metadata-derived"],
    undefined,
  );
  TestValidator.equals(
    "derived excludes base customizer",
    derived["x-metadata-base"],
    undefined,
  );
  TestValidator.equals(
    "derived customizer",
    derived["x-metadata-derived"],
    true,
  );
  TestValidator.equals(
    "inherited customizer",
    inherited["x-metadata-inherited"],
    true,
  );
};
