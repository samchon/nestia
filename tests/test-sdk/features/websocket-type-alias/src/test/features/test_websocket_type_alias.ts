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
