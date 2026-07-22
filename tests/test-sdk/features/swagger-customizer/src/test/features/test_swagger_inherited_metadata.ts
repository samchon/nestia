import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import {
  InheritedSwaggerController,
  InheritedSwaggerControllerBase,
} from "../../controllers/SwaggerController";

export const test_swagger_inherited_metadata = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const base: any =
    swagger.paths["/custom/inheritance/base/route"].get;
  const derived: any =
    swagger.paths["/custom/inheritance/derived/route"].get;
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
  TestValidator.equals(
    "base customizer",
    base["x-metadata-base"],
    true,
  );
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
