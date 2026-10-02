import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Calls the generated at simulator with an explicitly malformed UUID and
 * requires HttpError 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated at simulator with an explicitly malformed UUID and requires HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The authored id requires UUID format, so not-a-uuid is invalid independently of generator output.
 * @evidence contracts/testing.md#distinguishing-cases An ordinary valid section isolates UUID-tag rejection from section-string rejection. This case covers malformed UUID input only.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. An ordinary valid section isolates UUID-tag rejection from section-string rejection. This case covers malformed UUID input only.
 */
export const test_api_simulate_invalid_uuid = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid uuid", 400, () =>
    api.functional.bbs.articles.at(connection, "general", "not-a-uuid"),
  );
