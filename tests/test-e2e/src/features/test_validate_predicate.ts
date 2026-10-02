import { TestValidator } from "@nestia/e2e";

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
