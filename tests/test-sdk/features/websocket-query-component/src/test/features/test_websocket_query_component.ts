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
 * @evidence contracts/testing.md#behavioral-verification The assertions require that HTTP/raw/generated socket routes preserve question marks/equals in query values.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal name/query objects and URI query-component semantics, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns additional question marks, embedded equals and space-bearing path names across three clients.
 * @evidence contracts/testing.md#execution-ownership The websocket-query-component fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The websocket-query-component runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the websocket-query-component fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted additional question marks, embedded equals and space-bearing path names across three clients distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
