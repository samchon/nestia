import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the keyword SDK function documents its argument under the renamed
 * `props` parameter.
 *
 * In keyword mode the SDK's own `props` parameter yields to a method named
 * `props` (#1647), so a `@param props.x` tag would name a member of a parameter
 * that no longer exists, and an IDE would show the function undocumented.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its argument as `_props.props`.
 */
export const test_sdk_name_collision_keyword_jsdoc =
  async (): Promise<void> => {
    const content: string = await fs.promises.readFile(
      `${__dirname}/../../api/functional/shadow/index.ts`,
      "utf8",
    );
    TestValidator.equals(
      "@param",
      content.includes("@param _props.props Shadow to echo"),
      true,
    );
  };
