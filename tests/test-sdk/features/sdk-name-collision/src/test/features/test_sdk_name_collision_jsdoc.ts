import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the SDK function documents a renamed parameter under its new name.
 *
 * A positional parameter named like its method is renamed with a `_` prefix
 * (#1647); a `@param` tag still naming the old identifier would describe no
 * parameter, and an IDE would show the function undocumented.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its renamed `_props` parameter.
 */
export const test_sdk_name_collision_jsdoc = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/shadow/index.ts`,
    "utf8",
  );
  TestValidator.equals(
    "@param",
    content.includes("@param _props Shadow to echo"),
    true,
  );
};
