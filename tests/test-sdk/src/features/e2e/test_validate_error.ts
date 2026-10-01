import { TestValidator } from "@nestia/e2e";

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
 * @evidence contracts/testing.md#behavioral-verification It calls `TestValidator.error()` with throwing, rejecting, returning, and resolving tasks and observes the outcome with a plain `try`/`catch`, which detects a `no exception` failure swallowed by its own `catch`.
 * @evidence contracts/testing.md#independent-expectations The verdict must not come from `error()` itself, so a plain `try`/`catch` observes it, which is independent of the code under test.
 * @evidence contracts/testing.md#distinguishing-cases Throwing and rejecting tasks pass; returning and resolving tasks fail with the validator's message, synchronously and asynchronously, so each of the four combinations is separate.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
