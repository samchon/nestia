import { DynamicExecutor, TestValidator } from "@nestia/e2e";

/**
 * Verifies dynamicExecutor.assert and validate reject zero concurrency before
 * loading a location.
 *
 * A zero simultaneous budget cannot execute any queued task and is an invalid
 * public option.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert both public entrypoints reject zero with a nonexistent location,
 *    separating validation from filesystem discovery.
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
