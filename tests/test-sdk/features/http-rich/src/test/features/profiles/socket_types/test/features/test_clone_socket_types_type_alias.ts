import { TestValidator } from "@nestia/e2e";

import { ISocketTypesAliasListener } from "../../../../../../structures/options/socket_types/ISocketTypesAliases";
import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification Eight renamed/local/external/generic/defaulted/chained/import-type acceptor and driver spellings must return the authored header greeting and exact single callback; all original assertions execute.
 * @evidence contracts/testing.md#independent-expectations Equivalent tgrid type aliases preserve acceptor/header/provider/listener meanings; the authored route labels and controller greeting define literal expected strings and callbacks.
 * @evidence contracts/testing.md#distinguishing-cases All eight original spelling variants preserve both server-provider and server-driver directions; distinct route/header labels reject mistaken callback routing.
 * @evidence contracts/testing.md#execution-ownership The shared compiled consumer discovers this matching file/export after fresh SDK generation. Its original actual requests or connections retain finally-owned connector teardown.
 * @evidence contracts/e2e.md#necessary-boundary Actual native alias-type extraction, generated SDK connection signatures and provider/listener RPC must agree; direct type-analysis units cannot prove the served generated client.
 * @evidence contracts/e2e.md#shared-execution Both original owners enable SDK alone with identical native defaults. One combined generation graph shares the existing installed artifacts, default producer, one consumer compilation and upgraded HTTP listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities isolate these stateless providers. Each original connection owns local expected values/callbacks and closes in finally; runner finally closes the shared server/adaptor.
 * @evidence contracts/e2e.md#preserved-coverage Complete original controllers/types/helper bodies and both case operations/assertions/imports remain, with only private identities and source/artifact addresses rebased. The original wrappers own no additional assertions.
 */
export const test_clone_socket_types_type_alias = async (
  connection: api.IConnection,
): Promise<void> => {
  const routes = [
    ["renamed", api.functional.http_rich.options.socket_types.alias.renamed],
    ["local", api.functional.http_rich.options.socket_types.alias.local],
    ["aliased", api.functional.http_rich.options.socket_types.alias.aliased],
    ["generic", api.functional.http_rich.options.socket_types.alias.generic],
    [
      "defaulted",
      api.functional.http_rich.options.socket_types.alias.defaulted,
    ],
    ["chained", api.functional.http_rich.options.socket_types.alias.chained],
    ["imported", api.functional.http_rich.options.socket_types.alias.imported],
    [
      "importedAlias",
      api.functional.http_rich.options.socket_types.alias.importedAlias,
    ],
  ] as const;
  for (const [route, connect] of routes) {
    const notified: string[] = [];
    const listener: ISocketTypesAliasListener = {
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
