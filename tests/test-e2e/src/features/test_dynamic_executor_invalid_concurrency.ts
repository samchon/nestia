import { DynamicExecutor, TestValidator } from "@nestia/e2e";

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
