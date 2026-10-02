import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import {
  InheritedSwaggerController,
  InheritedSwaggerControllerBase,
} from "../../controllers/SwaggerController";

/**
 * Checks decorator examples and generated customizer extensions remain
 * separated between base, derived and inherited routes.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks decorator examples and generated customizer extensions remain separated between base, derived and inherited routes.
 * @evidence contracts/testing.md#independent-expectations Authored example literals and distinct base/derived/inherited customizers define which routes may carry each marker.
 * @evidence contracts/testing.md#distinguishing-cases Positive markers are paired with absence of the other class marker, detecting cross-prototype contamination.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-customizer/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-customizer controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-customizer test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_inherited_metadata retain positive markers are paired with absence of the other class marker, detecting cross-prototype contamination.
 */
export const test_swagger_inherited_metadata = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const base: any = swagger.paths["/custom/inheritance/base/route"].get;
  const derived: any = swagger.paths["/custom/inheritance/derived/route"].get;
  const inherited: any =
    swagger.paths["/custom/inheritance/derived/inherited"].get;
  const baseExamples: Array<{ example: string }> = Reflect.getOwnMetadata(
    "nestia/SwaggerExample/Parameters",
    InheritedSwaggerControllerBase.prototype,
    "example",
  );
  const derivedExamples: Array<{ example: string }> = Reflect.getOwnMetadata(
    "nestia/SwaggerExample/Parameters",
    InheritedSwaggerController.prototype,
    "example",
  );
  const inheritedExamples: Array<{ example: string }> = Reflect.getMetadata(
    "nestia/SwaggerExample/Parameters",
    InheritedSwaggerController.prototype,
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
