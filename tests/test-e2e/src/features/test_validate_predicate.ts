import { TestValidator } from "../../../../packages/e2e/lib";

/**
 * Verifies testValidator.predicate accepts true and rejects false consistently
 * across task forms.
 *
 * Boolean truth establishes predicate success and false establishes a labeled
 * Error.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert scalar, closure and asynchronous forms exercise both truth values and
 *    verify that all three failures carry the same Error message.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls TestValidator.predicate with scalar, callback and asynchronous conditions and checks false results are Errors with the exact message.
 * @evidence contracts/testing.md#independent-expectations Literal true and false values establish condition satisfaction, while ordinary error collection checks the failure type and message.
 * @evidence contracts/testing.md#distinguishing-cases True conditions pass and false conditions fail in all three forms; asynchronous rejection must carry an Error rather than a string.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
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
