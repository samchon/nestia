import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export const test_swagger_inherited_metadata = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const base: any =
    swagger.paths["/custom/inheritance/base/{value}"].get;
  const derived: any =
    swagger.paths["/custom/inheritance/derived/{value}"].get;
  const inherited: any =
    swagger.paths["/custom/inheritance/derived/inherited/{value}"].get;

  TestValidator.equals(
    "base parameter example",
    base.parameters[0].example,
    "base",
  );
  TestValidator.equals(
    "derived parameter example",
    derived.parameters[0].example,
    "derived",
  );
  TestValidator.equals(
    "inherited parameter example",
    inherited.parameters[0].example,
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
