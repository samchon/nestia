import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the SDK function documents a renamed parameter under its new name.
 *
 * A positional parameter named like its method is renamed with a `_` prefix
 * (#1647); a `@param` tag still naming the old identifier would describe no
 * parameter, and an IDE would show the function undocumented.
 *
 * The WebSocket function documents its parameters the same way. In a route
 * named `query`, the path parameter `query` yields to the route as `_query`,
 * and the query object to both as `__query`; a tag naming the controller's
 * parameter would describe no parameter.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its renamed `_props` parameter.
 * 3. Read the generated SDK file of `SocketController`.
 * 4. Assert the `query` function documents the path parameter as `_query` and the
 *    query object as `__query`.
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

  const socket: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/socket/index.ts`,
    "utf8",
  );
  TestValidator.equals(
    "@param path",
    socket.includes(
      "@param _query Path segment named like the query parameter",
    ),
    true,
  );
  TestValidator.equals(
    "@param query",
    socket.includes("@param __query Shadow to search"),
    true,
  );
};
