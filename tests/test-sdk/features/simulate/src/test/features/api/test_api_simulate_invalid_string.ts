import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Calls the generated at simulator with null section and a valid UUID and
 * requires HttpError 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated at simulator with null section and a valid UUID and requires HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The at route requires a nonnullable string section; a valid UUID keeps the other path parameter from explaining failure.
 * @evidence contracts/testing.md#distinguishing-cases Null is the adjacent rejected string boundary, while a separate test owns invalid UUID rejection. No transport should reach the controller in simulation.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Null is the adjacent rejected string boundary, while a separate test owns invalid UUID rejection. No transport should reach the controller in simulation.
 */
export const test_api_simulate_invalid_string = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid string", 400, () =>
    api.functional.bbs.articles.at(connection, null!, uuid()),
  );

const uuid = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
