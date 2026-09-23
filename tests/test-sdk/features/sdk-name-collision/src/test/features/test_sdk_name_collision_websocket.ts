import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies WebSocket SDK functions whose path parameters are named after the
 * SDK's own parameters and locals connect and send every argument.
 *
 * The WebSocket SDK names its own `connection`, `provider`, and `query`
 * parameters and its `url`, `connector`, and `driver` locals, and a path
 * parameter of the same name made the SDK fail to compile (#1647). Its `path()`
 * also read the query object by the controller's parameter name while declaring
 * it as `query`, so a query parameter named otherwise broke it.
 *
 * 1. Connect to the route whose path parameters are named after the locals, with a
 *    query parameter not named `query`, and read its echo.
 * 2. Connect to the route with a path parameter named `query`, to the route named
 *    `url`, and to the route named `exports`, which TypeScript reserves in a
 *    CommonJS module's scope, and read their echoes.
 */
export const test_sdk_name_collision_websocket = async (
  connection: api.IConnection,
): Promise<void> => {
  const echo = async (
    output: Promise<{ connector: { close(): Promise<void> }; driver: any }>,
  ): Promise<string[]> => {
    const { connector, driver } = await output;
    try {
      return await driver.echo();
    } finally {
      await connector.close();
    }
  };
  const sockets = api.functional.socket;
  const socket: api.IConnection<undefined> = { host: connection.host };
  TestValidator.equals(
    "locals",
    await echo(
      sockets.locals(socket, "u", "c", "d", "n", "p", { value: "q" }, null),
    ),
    ["u", "c", "d", "n", "p", "q"],
  );
  TestValidator.equals(
    "query",
    await echo(sockets.query(socket, "path", { value: "search" }, null)),
    ["path", "search"],
  );
  TestValidator.equals("url", await echo(sockets.url(socket, null)), ["url"]);
  TestValidator.equals("exports", await echo(sockets.exports(socket, null)), [
    "exports",
  ]);
};
