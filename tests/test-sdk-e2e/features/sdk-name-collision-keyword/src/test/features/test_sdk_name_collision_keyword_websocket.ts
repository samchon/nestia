import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies keyword-mode WebSocket SDK functions whose path parameters are named
 * after the SDK's own `props` keys connect and send every argument.
 *
 * A path parameter is a user's `props` key, while `query` and `provider` are
 * the SDK's, so a path parameter of the same name made `Props` declare the key
 * twice (#1647); the SDK's key now yields with a `_` prefix. It yields to
 * nothing else, since a key shadows no name. `path()` also read the query
 * object by the controller's parameter name.
 *
 * 1. Connect to the route with path parameters named after the SDK's locals and
 *    its `provider` key, with a query parameter not named `query`.
 * 2. Connect to the route with a path parameter named `query`, to the route named
 *    `url`, and to the route named `exports`, which TypeScript reserves in a
 *    CommonJS module's scope, and read their echoes.
 * 3. Connect to the route named `provider` through its `query` and `provider`
 *    keys, and read its echo.
 *
 * @evidence contracts/testing.md#behavioral-verification Five keyword props socket connections must deliver exact locals/query/url/exports/provider echoes.
 * @evidence contracts/testing.md#independent-expectations The explicit u/c/d/n/p/q and path/search arguments and the authored socket providers determine ordered echoes independently of generated binding.
 * @evidence contracts/testing.md#distinguishing-cases Path names colliding with connection/driver/provider, a query key collision and exported function collisions retain distinct WebSocket binding branches.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_keyword_websocket export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native socket metadata, generated connector bindings and the actual provider handshake/echo must connect; a printed signature alone cannot establish transported parameter positions.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its feature backend and socket adaptor with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each established connector is closed in finally, including echo/assertion failures. The feature owns its backend/port and copied output tree; sequential cases consume their own submitted values.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_keyword_websocket assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
 */
export const test_sdk_name_collision_keyword_websocket = async (
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
      sockets.locals(socket, {
        url: "u",
        connector: "c",
        driver: "d",
        connection: "n",
        provider: "p",
        query: { value: "q" },
        _provider: null,
      }),
    ),
    ["u", "c", "d", "n", "p", "q"],
  );
  TestValidator.equals(
    "query",
    await echo(
      sockets.query(socket, {
        query: "path",
        _query: { value: "search" },
        provider: null,
      }),
    ),
    ["path", "search"],
  );
  TestValidator.equals(
    "url",
    await echo(sockets.url(socket, { provider: null })),
    ["url"],
  );
  TestValidator.equals(
    "exports",
    await echo(sockets.exports(socket, { provider: null })),
    ["exports"],
  );
  TestValidator.equals(
    "provider",
    await echo(
      sockets.provider(socket, {
        query: { value: "search" },
        provider: null,
      }),
    ),
    ["provider", "search"],
  );
};
