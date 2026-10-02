import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies customizers edit the operations and values the routes composed.
 *
 * Composition copies the document before the customizers run, so their edits
 * cannot reach route metadata (#1654). The copy must not change what they
 * receive: each customizer gets its own route's operation even after an earlier
 * one moved its path, and an example JSON cannot hold reaches the customizer
 * that converts it, instead of failing the composition.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the route whose first customizer moved its path carries the second
 *    customizer's edit at the new path, and nothing is left at the old one.
 * 3. Assert the bigint example arrives as the digits its customizer wrote.
 */
export const test_swagger_customizer_sees_composed_values =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    TestValidator.equals(
      "moved operation",
      swagger.paths["/custom/moved"]?.get?.["x-after-move"],
      true,
    );
    TestValidator.equals(
      "old path",
      swagger.paths["/custom/movable"],
      undefined,
    );
    TestValidator.equals(
      "bigint example",
      swagger.paths["/custom/bigint/{value}"].get.parameters[0].example,
      "12345678901234567890",
    );
  };
