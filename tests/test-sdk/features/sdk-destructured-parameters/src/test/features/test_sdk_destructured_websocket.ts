import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification The destructured socket query and path id must arrive as the exact id/k echo.
 * @evidence contracts/testing.md#independent-expectations Explicit id/k and the authored provider echo independently determine both expected positions.
 * @evidence contracts/testing.md#distinguishing-cases A real WebSocket handshake with a destructured query contrasts the HTTP destructuring cases; this case has no malformed-query assertion.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_destructured_websocket export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native socket metadata, generated connector bindings and the actual provider handshake/echo must connect; a printed signature alone cannot establish transported parameter positions.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its feature backend and socket adaptor with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each established connector is closed in finally, including echo/assertion failures. The feature owns its backend/port and copied output tree; sequential cases consume their own submitted values.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_destructured_websocket assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
