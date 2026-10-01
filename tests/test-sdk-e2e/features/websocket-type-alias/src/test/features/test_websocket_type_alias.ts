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
 * @evidence contracts/testing.md#behavioral-verification Eight renamed/local/aliased/generic/defaulted/chained/imported/importedAlias connectors must greet with the exact header name and notify the matching listener once.
 * @evidence contracts/testing.md#independent-expectations Authored header/provider/listener echo contract establishes hello plus route and the single route notification independently of type spelling analysis.
 * @evidence contracts/testing.md#distinguishing-cases Eight equivalent tgrid identities spelled through different aliases contrast textual checks with resolved types and type arguments.
 * @evidence contracts/testing.md#execution-ownership The matching test_websocket_type_alias export is discovered and awaited by its emitted feature entry. Assertions and rejection deadlines fail the report, while zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native resolved type/argument extraction, generated connector and actual provider/driver callback must connect; checking alias names alone cannot certify transported headers/listener methods.
 * @evidence contracts/e2e.md#shared-execution All raw/generated connections or alias routes share their feature backend and generated artifacts. Packed installation and compatible producer/runtime programs are shared; the case launches no compiler per connection.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each alias allocates separate notification state and header identity, closes its connector in finally, and consumes exactly its own callback. The entry closes the shared backend and copied outputs remain feature-owned.
 * @evidence contracts/e2e.md#preserved-coverage All test_websocket_type_alias raw/generated echoes or deadline/code/reason controls above remain executable. Resource scopes were extended to preparation failures, without replacing the real adaptor or alias connection with mocks.
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
