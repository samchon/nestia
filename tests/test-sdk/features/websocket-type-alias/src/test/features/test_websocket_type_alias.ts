import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IAliasListener } from "@api/lib/structures/IAliasSocket";

/**
 * Verifies WebSocket routes whose acceptor and driver types are spelled by a
 * renamed import, a type alias, or an import type build, generate an SDK, and
 * serve.
 *
 * The core transform checked `@WebSocketRoute.Acceptor()` and `.Driver()`
 * parameters by the text of their annotation, which had to start with
 * `WebSocketAcceptor` or `Driver`, so every such route failed the build
 * although its type was exactly tgrid's (#1671). The SDK needs the acceptor's
 * three type arguments, which an alias writes in its own declaration, and a
 * generic alias through its own type parameters. An import type such as
 * `import("tgrid").Driver<Listener>`, which that text check accepted, must
 * still build, and the SDK must read its type arguments too.
 *
 * 1. For each route, connect through the SDK with a header and a listener.
 * 2. Assert the provider answers with the header and the server's driver reaches
 *    the listener.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that eight alias route clients greet from their header and invoke their listener.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal route/header values, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns renamed/local/imported/chained/generic/defaulted acceptor and driver aliases.
 * @evidence contracts/testing.md#execution-ownership The websocket-type-alias fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The websocket-type-alias runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the websocket-type-alias fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted renamed/local/imported/chained/generic/defaulted acceptor and driver aliases distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_websocket_type_alias = async (
  connection: api.IConnection,
): Promise<void> => {
  const routes = [
    ["renamed", api.functional.alias.renamed],
    ["local", api.functional.alias.local],
    ["aliased", api.functional.alias.aliased],
    ["generic", api.functional.alias.generic],
    ["defaulted", api.functional.alias.defaulted],
    ["chained", api.functional.alias.chained],
    ["imported", api.functional.alias.imported],
    ["importedAlias", api.functional.alias.importedAlias],
  ] as const;
  for (const [route, connect] of routes) {
    const notified: string[] = [];
    const listener: IAliasListener = {
      notify: (value) => notified.push(value),
    };
    const { connector, driver } = await connect(
      { host: connection.host, headers: { name: route } },
      listener,
    );
    try {
      TestValidator.equals(route, await driver.greet(), `hello ${route}`);
      TestValidator.equals(`${route} driver`, notified, [route]);
    } finally {
      await connector.close();
    }
  }
};
