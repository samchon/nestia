import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies the simulator in propagation mode answers headers the server's
 * validator refuses with a failed 400 propagation, as the server does (#1721).
 *
 * 1. Send an invalid `x-id` to the server and to the simulator: both answer
 *    `success: false` with status 400.
 * 2. Send a valid one to the simulator: it answers `success: true`.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks server and simulator return failed propagation status 400 for invalid x-id and successful propagation for valid simulated headers.
 * @evidence contracts/testing.md#independent-expectations Propagation preserves validation failure as success:false/status:400 instead of throwing; the authored UUID header establishes invalid and valid literals.
 * @evidence contracts/testing.md#distinguishing-cases Both transport modes and both header states distinguish failed propagation from exception mode and from incorrectly accepting invalid headers.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate-headers-propagate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate-headers-propagate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Both transport modes and both header states distinguish failed propagation from exception mode and from incorrectly accepting invalid headers.
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
