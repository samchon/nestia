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
