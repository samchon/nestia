import { TestValidator } from "@nestia/e2e";
import { WebSocketConnector } from "tgrid";

import { ISocketTypesQueryProbe } from "../../../../../../structures/options/socket_types/ISocketTypesQueryProbe";
import api from "../../api";

/**
 * Verifies a WebSocket route reads the whole query component after the first
 * `?`, as `@TypedQuery()` reads an HTTP query.
 *
 * `WebSocketAdaptor` took the query from `path.split("?")[1]`, so a query
 * holding another `?`, which RFC 3986 allows there, lost everything after it:
 * `?q=what?` delivered `q = "what"` (#1667).
 *
 * 1. Request the HTTP route with a query whose values hold `?` and `=`.
 * 2. Connect the WebSocket route with the same raw query and assert it reads what
 *    HTTP read.
 * 3. Connect through the SDK and assert the same values arrive.
 *
 * @evidence contracts/testing.md#behavioral-verification Literal question-mark/equal-sign query values and percent-encoded path text must match the authored object over HTTP, raw WebSocket and generated SDK; all original assertions execute.
 * @evidence contracts/testing.md#independent-expectations RFC3986 permits embedded question marks in the query component; the literal authored expected object supplies all values independently of decoder output.
 * @evidence contracts/testing.md#distinguishing-cases HTTP, raw WebSocket and generated SDK must agree on both q=what? and r=a=b?c, retaining hello world after path decoding.
 * @evidence contracts/testing.md#execution-ownership The shared compiled consumer discovers this matching file/export after fresh SDK generation. Its original actual requests or connections retain finally-owned connector teardown.
 * @evidence contracts/e2e.md#necessary-boundary Actual HTTP/native query parsing, raw WebSocket query extraction and generated SDK URI encoding must agree across the same public upgraded server.
 * @evidence contracts/e2e.md#shared-execution Both original owners enable SDK alone with identical native defaults. One combined generation graph shares the existing installed artifacts, default producer, one consumer compilation and upgraded HTTP listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities isolate these stateless providers. Each original connection owns local expected values/callbacks and closes in finally; runner finally closes the shared server/adaptor.
 * @evidence contracts/e2e.md#preserved-coverage Complete original controllers/types/helper bodies and both case operations/assertions/imports remain, with only private identities and source/artifact addresses rebased. The original wrappers own no additional assertions.
 */
export const test_clone_socket_types_query_component = async (
  connection: api.IConnection,
): Promise<void> => {
  const expected: ISocketTypesQueryProbe = {
    name: "hello world",
    query: { q: "what?", r: "a=b?c" },
  };
  const url: string = `/http_rich/options/socket_types/probe/hello%20world?q=what?&r=a=b?c`;

  const response: Response = await fetch(`${connection.host}${url}`);
  TestValidator.equals("http", await response.json(), expected);

  const raw: WebSocketConnector<
    undefined,
    null,
    ISocketTypesQueryProbe.IProvider
  > = new WebSocketConnector(undefined, null);
  await raw.connect(`${connection.host.replace(/^http/, "ws")}${url}`);
  try {
    TestValidator.equals("websocket", await raw.getDriver().get(), expected);
  } finally {
    await raw.close();
  }

  const { connector, driver } =
    await api.functional.http_rich.options.socket_types.probe.socket(
      { host: connection.host },
      expected.name,
      expected.query,
      null,
    );
  try {
    TestValidator.equals("sdk", await driver.get(), expected);
  } finally {
    await connector.close();
  }
};
