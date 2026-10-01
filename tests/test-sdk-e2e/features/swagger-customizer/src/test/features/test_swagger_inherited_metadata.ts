import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import {
  InheritedSwaggerController,
  InheritedSwaggerControllerBase,
} from "../../controllers/SwaggerController";

/**
 * Verifies swagger inherited metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Base/derived own examples remain base/derived, inherited example remains inherited, and each document operation receives only its intended customizer.
 * @evidence contracts/testing.md#independent-expectations Authored base/derived decorators and their distinct strings/x-metadata flags independently establish ownership.
 * @evidence contracts/testing.md#distinguishing-cases Own metadata contrasts inherited lookup; base must exclude derived edits and overridden derived route excludes base edits, while a genuinely inherited route keeps its inherited customizer.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_inherited_metadata export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reflect reads target this feature’s authored base/derived prototypes without modifying them. Its own document outputs remain separate from other members and the entry closes its backend.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_inherited_metadata selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
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
