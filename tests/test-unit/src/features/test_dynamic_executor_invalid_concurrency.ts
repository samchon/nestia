import { DynamicExecutor, TestValidator } from "@nestia/e2e";

/**
 * Verifies `DynamicExecutor` rejects a concurrency of zero before it discovers
 * anything, in both its `assert` and its `validate` forms.
 *
 * 1. Call `assert()` and `validate()` with `simultaneous: 0` and a location that
 *    does not exist.
 * 2. Assert both fail.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `DynamicExecutor.assert()` and `validate()` with `simultaneous: 0` and asserts each throws, which detects an executor that starts no worker and returns an empty passing report.
 * @evidence contracts/testing.md#independent-expectations A concurrency of zero can run no test, so refusing it is the contract; the location is one that need not exist, which shows the check happens before discovery.
 * @evidence contracts/testing.md#distinguishing-cases The two entry points are separate cases of the same rule; other invalid values such as a negative or fractional concurrency are not exercised here.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_dynamic_executor_invalid_concurrency(): Promise<void> {
  const props = {
    location: "does-not-need-to-exist",
    parameters: () => [],
    prefix: "test",
    simultaneous: 0,
  };
  await TestValidator.error("assert zero concurrency", () =>
    DynamicExecutor.assert(props),
  );
  await TestValidator.error("validate zero concurrency", () =>
    DynamicExecutor.validate(props),
  );
}
