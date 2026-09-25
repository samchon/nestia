import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a WebSocket route whose handler destructures its query object
 * compiles and connects.
 *
 * The core transform validates a WebSocket route's parameters and named each
 * one for its diagnostics by reading an identifier, which a destructured
 * parameter is not, so compiling such a controller crashed (#1660).
 *
 * 1. Connect to the route with a path parameter and a query object.
 * 2. Assert the echo carries both.
 */
export const test_sdk_destructured_websocket = async (
  connection: api.IConnection,
): Promise<void> => {
  const { connector, driver } =
    await api.functional.destructured.socket.connect(
      { host: connection.host },
      "id",
      { keyword: "k" },
      null,
    );
  try {
    TestValidator.equals("echo", await driver.echo(), ["id", "k"]);
  } finally {
    await connector.close();
  }
};
