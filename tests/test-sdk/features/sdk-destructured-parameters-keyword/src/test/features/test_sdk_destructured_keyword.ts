import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies keyword-mode SDK functions of routes whose handlers destructure
 * their parameters, whose synthesized names are public `props` keys.
 *
 * A destructured parameter declares no name, and the SDK's metadata pass
 * crashed reading one (#1660). In keyword mode the name the SDK gives it is the
 * `props` key a caller writes, so this test pins them at compile time: `body`,
 * `query`, `pageSize` for the `page-size` query key, and `_body` beside the
 * handler's own `body` parameter, which keeps its name.
 *
 * 1. Call each HTTP route through its `props` keys and assert the echo.
 * 2. Connect to the WebSocket route through `id`, `query`, and `provider`.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that HTTP and socket keyword clients echo inputs through synthesized keys.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal caller props and public key names, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns body/query/pageSize/_body and socket id/query/provider keys.
 * @evidence contracts/testing.md#execution-ownership The sdk-destructured-parameters-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-destructured-parameters-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-destructured-parameters-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted body/query/pageSize/_body and socket id/query/provider keys distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_destructured_keyword = async (
  connection: api.IConnection,
): Promise<void> => {
  const destructured = api.functional.destructured;
  TestValidator.equals(
    "body",
    await destructured.body(connection, {
      body: { title: "t", body: "b" },
    }),
    { title: "t", body: "b" },
  );
  TestValidator.equals(
    "query",
    await destructured.query(connection, {
      query: { page: 3, keyword: "k" },
    }),
    { page: 3, keyword: "k" },
  );
  TestValidator.equals(
    "field",
    await destructured.field(connection, { pageSize: "abc" }),
    "field",
  );
  TestValidator.equals(
    "collide",
    await destructured.collide(connection, {
      body: "path",
      _body: { title: "t", body: "b" },
    }),
    ["path", "t"],
  );

  const { connector, driver } =
    await api.functional.destructured.socket.connect(
      { host: connection.host },
      { id: "id", query: { keyword: "k" }, provider: null },
    );
  try {
    TestValidator.equals("echo", await driver.echo(), ["id", "k"]);
  } finally {
    await connector.close();
  }
};
