import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Calls the generated first simulator with an explicitly malformed
 * calendar-date parameter and requires HttpError 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated first simulator with an explicitly malformed calendar-date parameter and requires HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The authored path parameter is a date-format string, so not-a-date is an independently invalid value.
 * @evidence contracts/testing.md#distinguishing-cases The date-tag rejection differs from an ordinary string or UUID check; a neighboring UUID test owns that tag. This case covers the malformed date boundary.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. The date-tag rejection differs from an ordinary string or UUID check; a neighboring UUID test owns that tag. This case covers the malformed date boundary.
 */
export const test_api_simulate_invalid_date = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid date", 400, () =>
    api.functional.bbs.articles.first(connection, "general", "not-a-date"),
  );
