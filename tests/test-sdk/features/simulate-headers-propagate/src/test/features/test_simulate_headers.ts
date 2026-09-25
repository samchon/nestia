import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies the simulator in propagation mode answers headers the server's
 * validator refuses with a failed 400 propagation, as the server does (#1721).
 *
 * 1. Send an invalid `x-id` to the server and to the simulator: both answer
 *    `success: false` with status 400.
 * 2. Send a valid one to the simulator: it answers `success: true`.
 */
export const test_simulate_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const simulate of [false, true]) {
    const output = await api.functional.headers.get({
      host: connection.host,
      simulate,
      headers: { "x-id": "not-a-uuid" },
    });
    TestValidator.equals(`simulate ${simulate} success`, output.success, false);
    TestValidator.equals(`simulate ${simulate} status`, output.status, 400);
  }
  const valid = await api.functional.headers.get({
    host: connection.host,
    simulate: true,
    headers: { "x-id": "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69" },
  });
  TestValidator.equals("valid", valid.success, true);
};
