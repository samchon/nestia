import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies `"stringify": "validate.log"` logs an invalid `@TypedQuery.Get()`
 * response and sends it, as it does a `@TypedRoute` JSON one.
 *
 * The querified responses had no `validate.log` mode: the transform took its
 * `assert` default, so the route answered 500 instead of logging (#1727).
 *
 * 1. Register a logger and fetch a route whose response has an invalid `id`.
 * 2. Assert it answers 200 with the querified body.
 * 3. Assert exactly one log entry names the method, path, and the error.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches malformed query output and asserts HTTP 200, id=wrong-data&count=3 and exactly one logger record at $input.id.
 * @evidence contracts/testing.md#independent-expectations The query controller deliberately violates its UUID field while returning count 3; validate.log must report the violation and still serialize it.
 * @evidence contracts/testing.md#distinguishing-cases The invalid querified response distinguishes logging from the assert default that would return 500. JSON logging remains separately covered.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route-manual-validate-log/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route-manual-validate-log fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data. The logger is restored to the documented console logger in finally so later cases cannot retain this log array.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. The invalid querified response distinguishes logging from the assert default that would return 500. JSON logging remains separately covered.
 */
export const test_api_query_validate_log = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));
  try {
    const response: Response = await fetch(`${connection.host}/query`);
    TestValidator.equals("status", response.status, 200);
    TestValidator.equals(
      "body",
      await response.text(),
      "id=wrong-data&count=3",
    );
    TestValidator.equals("logs", logs.length, 1);
    TestValidator.equals("method", logs[0]?.method, "GET");
    TestValidator.equals("path", logs[0]?.path, "/query");
    TestValidator.equals(
      "error path",
      logs[0]?.errors.map((e) => e.path),
      ["$input.id"],
    );
  } finally {
    TypedRoute.setValidateErrorLogger(console.log);
  }
};
