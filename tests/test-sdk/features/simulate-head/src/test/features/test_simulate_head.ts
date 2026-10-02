import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies the SDK of a `HEAD` route with a parameter compiles and simulates
 * under `simulate: true`.
 *
 * The simulate function handed `NestiaSimulator.assert()` the `"HEAD"` method
 * and the `null` content type of a bodiless response, neither of which its
 * props admitted, so the SDK did not compile (#1723).
 *
 * 1. Call the route on the server and in simulation with a valid id.
 * 2. Call both with an invalid id: both reject with 400.
 */
export const test_simulate_head = async (
  connection: api.IConnection,
): Promise<void> => {
  const id: string = "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69";
  for (const simulate of [false, true]) {
    await api.functional.heads.head({ ...connection, simulate }, id);
    await TestValidator.httpError(`simulate ${simulate} invalid`, 400, () =>
      api.functional.heads.head({ ...connection, simulate }, "not-a-uuid"),
    );
  }
};
