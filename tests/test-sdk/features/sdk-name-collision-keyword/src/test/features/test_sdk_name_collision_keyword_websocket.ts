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
 * @evidence contracts/testing.md#behavioral-verification The assertions require that five keyword socket clients echo values with displaced _query/_provider keys.
 * @evidence contracts/testing.md#independent-expectations Expectations come from public key contract and literal props, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns query/provider key collisions and url/exports/provider methods.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted query/provider key collisions and url/exports/provider methods distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
