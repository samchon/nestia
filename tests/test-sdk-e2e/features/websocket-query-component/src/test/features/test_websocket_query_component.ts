import { TestValidator } from "@nestia/e2e";
import { WebSocketConnector } from "tgrid";

import api from "@api";
import { IQueryProbe } from "@api/lib/structures/IQueryProbe";

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
 * @evidence contracts/testing.md#behavioral-verification Raw HTTP/raw WebSocket/generated SDK must all deliver exact hello world and q=what?/r=a=b?c values.
 * @evidence contracts/testing.md#independent-expectations Handwritten expected object and explicitly constructed raw URL establish values independently of either parser or generated encoder.
 * @evidence contracts/testing.md#distinguishing-cases Additional question/equal characters inside query values and encoded path space contrast the first delimiter with later legal query content.
 * @evidence contracts/testing.md#execution-ownership The matching test_websocket_query_component export is discovered and awaited by its emitted feature entry. Assertions and rejection deadlines fail the report, while zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Raw URL parsing and generated encoding must connect to real HTTP and WebSocket adaptors; a local query parser test cannot establish both transport paths retain the whole component.
 * @evidence contracts/e2e.md#shared-execution All raw/generated connections or alias routes share their feature backend and generated artifacts. Packed installation and compatible producer/runtime programs are shared; the case launches no compiler per connection.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Raw connect belongs inside its finally-close scope; generated connector closes after its own echo. Expected input is local and immutable across comparisons; the entry owns the backend/port and harness owns copied outputs.
 * @evidence contracts/e2e.md#preserved-coverage All test_websocket_query_component raw/generated echoes or deadline/code/reason controls above remain executable. Resource scopes were extended to preparation failures, without replacing the real adaptor or alias connection with mocks.
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
  try {
    await raw.connect(`${connection.host.replace(/^http/, "ws")}${url}`);
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
