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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generated HEAD with a valid UUID and verifies both server and simulator reject malformed UUID with 400.
 * @evidence contracts/testing.md#independent-expectations HEAD has no response body and the authored id is UUID-tagged; successful void return and 400 rejection follow from that contract.
 * @evidence contracts/testing.md#distinguishing-cases Both true and false simulate flags and valid versus malformed ids distinguish generated HEAD configuration from generic GET simulation.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate-head/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate-head fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Both true and false simulate flags and valid versus malformed ids distinguish generated HEAD configuration from generic GET simulation.
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
