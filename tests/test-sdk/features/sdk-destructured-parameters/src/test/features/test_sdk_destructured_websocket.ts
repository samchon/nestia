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
 * @evidence contracts/testing.md#behavioral-verification The assertions require that generated socket echoes its path id and destructured query keyword.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal caller path/query values, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns positional socket arguments beside keyword and HTTP destructuring cases.
 * @evidence contracts/testing.md#execution-ownership The sdk-destructured-parameters fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-destructured-parameters runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-destructured-parameters fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted positional socket arguments beside keyword and HTTP destructuring cases distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
