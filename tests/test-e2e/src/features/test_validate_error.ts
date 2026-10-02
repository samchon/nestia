import { TestValidator } from "../../../../packages/e2e/lib";

/**
 * Verifies `TestValidator.error()` passes a task that throws or rejects, and
 * fails one that returns or resolves, synchronous and asynchronous alike.
 *
 * The synchronous "no exception" failure was thrown inside the `try` whose
 * `catch` accepts the task's exception, so it was swallowed and a task that
 * never threw passed (#1712). The old self-test checked `error()` with
 * `error()` and passed either way; these checks observe it with a plain
 * `try`/`catch` instead.
 *
 * 1. A throwing and a rejecting task pass.
 * 2. A returning task throws the validator's message, synchronously.
 * 3. A resolving task rejects with the validator's message.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls TestValidator.error with throwing and nonthrowing tasks and checks the exact failure messages using ordinary control flow.
 * @evidence contracts/testing.md#independent-expectations The contract requires a thrown or rejected Error; literal messages and direct catch handling avoid using error itself as the sole oracle.
 * @evidence contracts/testing.md#distinguishing-cases Synchronous and asynchronous thrown errors pass, while their nonthrowing counterparts must reject with their own labels.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
 */

export async function test_validate_error(): Promise<void> {
  // SYNCHRONOUS
  TestValidator.error("error", () => {
    throw new Error("expected");
  });
  const sync: unknown = (() => {
    try {
      TestValidator.error("no-error", () => 1);
    } catch (error) {
      return error;
    }
    return null;
  })();
  if (
    !(sync instanceof Error) ||
    sync.message !== "Bug on no-error: exception must be thrown."
  )
    throw new Error(
      "Bug on TestValidator.error(): a synchronous task that does not throw passed.",
    );

  // ASYNCHRONOUS
  await TestValidator.error("async-error", async () => {
    throw new Error("expected");
  });
  const async: unknown = await TestValidator.error(
    "async-no-error",
    async () => 1,
  ).then(
    () => null,
    (error) => error,
  );
  if (
    !(async instanceof Error) ||
    async.message !== "Bug on async-no-error: exception must be thrown."
  )
    throw new Error(
      "Bug on TestValidator.error(): an asynchronous task that does not reject passed.",
    );
}
