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
 * The WebSocket function documents its `props` keys the same way: the query
 * object's key yields to a path parameter named `query`, and a tag naming the
 * controller's parameter would describe no key. A wrapped description continues
 * under its first line, past the declared `props.query`.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its argument as `_props.props`.
 * 3. Read the generated SDK file of `SocketController`.
 * 4. Assert the `query` function documents the path parameter as `props.query` and
 *    the query object as `props._query`.
 * 5. Assert the `provider` function continues its wrapped `@param props.query`
 *    under its description.
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

    const socket: string = await fs.promises.readFile(
      `${__dirname}/../../api/functional/socket/index.ts`,
      "utf8",
    );
    TestValidator.equals(
      "@param path",
      socket.includes(
        "@param props.query Path segment named like the query parameter",
      ),
      true,
    );
    TestValidator.equals(
      "@param query",
      socket.includes("@param props._query Shadow to search"),
      true,
    );
    TestValidator.equals(
      "WebSocket @param continued under its description",
      socket.includes(
        `\n * ${" ".repeat("@param props.query ".length)}onto a second line\n`,
      ),
      true,
    );
  };
