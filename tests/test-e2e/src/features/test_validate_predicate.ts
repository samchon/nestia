import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `TestValidator.predicate()` accepts a true scalar, closure, or
 * promise and fails a false one with the same error.
 *
 * 1. Check true and false in scalar, closure, and asynchronous forms.
 * 2. Assert all three failing forms signal an `Error` with the same message.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `TestValidator.predicate()` with each form and asserts acceptance, the failure, and that the failure is an `Error` carrying the documented message, which detects an asynchronous form rejecting with a bare string.
 * @evidence contracts/testing.md#independent-expectations The message `Bug on same: expected condition is not satisfied.` is the documented text and is compared literally.
 * @evidence contracts/testing.md#distinguishing-cases Scalar, closure, and async forms each have a true and a false case, and the three failures are compared together.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_validate_predicate(): Promise<void> {
  // SCALAR
  TestValidator.predicate("true", true);
  TestValidator.error("false", () => TestValidator.predicate("", false));

  // CLOSURE
  TestValidator.predicate("true", () => true);
  TestValidator.error("false", () => TestValidator.predicate("", () => false));

  // ASYNC
  await TestValidator.predicate("true", async () => true);
  await TestValidator.error("false", () =>
    TestValidator.predicate("", async () => false),
  );

  // every failing form signals the same Error: the asynchronous one rejected
  // with the bare message string (#1680)
  const failures: unknown[] = [];
  try {
    TestValidator.predicate("same", false);
  } catch (error) {
    failures.push(error);
  }
  try {
    TestValidator.predicate("same", () => false);
  } catch (error) {
    failures.push(error);
  }
  await TestValidator.predicate("same", async () => false).catch((error) =>
    failures.push(error),
  );
  TestValidator.equals("failures", failures.length, 3);
  for (const error of failures)
    TestValidator.predicate(
      "failure is an Error with the message",
      error instanceof Error &&
        error.message === "Bug on same: expected condition is not satisfied.",
    );
}
