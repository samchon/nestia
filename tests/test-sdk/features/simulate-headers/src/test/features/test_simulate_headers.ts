import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Checks server and simulator reject invalid x-id with 400, then checks a valid simulated header returns string output.
 * @evidence contracts/testing.md#independent-expectations The controller declares a UUID header and string return; malformed and fixed valid UUID literals establish opposite expectations.
 * @evidence contracts/testing.md#distinguishing-cases Server versus simulator and invalid versus valid header values distinguish missing simulated header validation from general request success.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate-headers/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate-headers fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Server versus simulator and invalid versus valid header values distinguish missing simulated header validation from general request success.
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
