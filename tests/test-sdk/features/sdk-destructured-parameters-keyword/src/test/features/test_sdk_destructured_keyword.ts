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
 * @evidence contracts/testing.md#behavioral-verification Keyword body/query/pageSize/_body calls and socket id/query/provider must deliver the exact authored echoes.
 * @evidence contracts/testing.md#independent-expectations Explicit t/b, page3/k, path/t and id/k inputs plus the echo controllers establish the expected values. Public props keys are also checked by actual consumer compilation.
 * @evidence contracts/testing.md#distinguishing-cases Destructured body/query/field beside named body and WebSocket parameters contrast synthesis with collision escaping.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_destructured_keyword export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native socket metadata, generated connector bindings and the actual provider handshake/echo must connect; a printed signature alone cannot establish transported parameter positions.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its feature backend and socket adaptor with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each established connector is closed in finally, including echo/assertion failures. The feature owns its backend/port and copied output tree; sequential cases consume their own submitted values.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_destructured_keyword assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
