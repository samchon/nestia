import { TestValidator } from "@nestia/e2e";
import { WebSocketConnector } from "tgrid";

import api from "../../api";
import { IQueryProbe } from "../../api/structures/IQueryProbe";

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
 */
export const test_websocket_query_component = async (
  connection: api.IConnection,
): Promise<void> => {
  const expected: IQueryProbe = {
    name: "hello world",
    query: { q: "what?", r: "a=b?c" },
  };
  const url: string = `/probe/hello%20world?q=what?&r=a=b?c`;

  const response: Response = await fetch(`${connection.host}${url}`);
  TestValidator.equals("http", await response.json(), expected);

  const raw: WebSocketConnector<undefined, null, IQueryProbe.IProvider> =
    new WebSocketConnector(undefined, null);
  await raw.connect(`${connection.host.replace(/^http/, "ws")}${url}`);
  try {
    TestValidator.equals("websocket", await raw.getDriver().get(), expected);
  } finally {
    await raw.close();
  }

  const { connector, driver } = await api.functional.probe.socket(
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
