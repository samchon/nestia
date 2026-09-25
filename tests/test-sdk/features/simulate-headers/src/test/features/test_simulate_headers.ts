import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies the simulator refuses headers the server's validator refuses, with
 * the same 400, and simulates valid ones.
 *
 * The simulator validated path parameters, the query, and the body, but not
 * `@TypedHeaders()`, so a request the server refused with 400 succeeded in
 * simulation (#1721).
 *
 * 1. Send an invalid `x-id` to the server and to the simulator: both reject with
 *    400.
 * 2. Send a valid one to the simulator: it answers.
 */
export const test_simulate_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const simulate of [false, true])
    await TestValidator.httpError(`simulate ${simulate}`, 400, () =>
      api.functional.headers.get({
        host: connection.host,
        simulate,
        headers: { "x-id": "not-a-uuid" },
      }),
    );
  TestValidator.equals(
    "valid",
    typeof (await api.functional.headers.get({
      host: connection.host,
      simulate: true,
      headers: { "x-id": "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69" },
    })),
    "string",
  );
};
