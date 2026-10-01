import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `TestValidator.httpError()` reports a thrown non-object as a failed
 * expectation instead of crashing on it.
 *
 * The check read `constructor` of the thrown value, so throwing `null` raised a
 * `TypeError` that hid the real failure.
 *
 * 1. Run a task that throws `null`, a string, and a number.
 * 2. Assert each is reported as a failed expectation naming the status.
 * 3. Assert a task that succeeds is reported the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `TestValidator.httpError()` on tasks that throw `null`, a string, and a number, and on one that succeeds, and asserts the failed expectation naming the status, not a `TypeError` from reading `constructor`.
 * @evidence contracts/testing.md#independent-expectations A thrown non-object is not an HTTP error, so the expectation fails with the documented message; the message text is asserted literally.
 * @evidence contracts/testing.md#distinguishing-cases Three non-object throws and a success are the negative cases beside `test_validate_http_error`'s matching and mismatching HTTP errors.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export function test_validate_http_error_non_object(): void {
  const attempts: Array<() => void> = [
    ...[null, "text", 42].map((thrown) => () => {
      TestValidator.httpError("non-object", 404, () => {
        throw thrown;
      });
    }),
    () => {
      TestValidator.httpError("succeeds", 404, () => 1);
    },
  ];
  for (const attempt of attempts) {
    let error: unknown = null;
    try {
      attempt();
    } catch (exp) {
      error = exp;
    }
    if (
      !(error instanceof Error) ||
      error.message.includes("status code must be 404") === false
    )
      throw new Error(`the expectation was not reported: ${String(error)}.`);
  }
}
