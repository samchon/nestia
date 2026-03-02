import { TestValidator } from "@nestia/e2e";

export async function test_validate_error(): Promise<void> {
  // ASYNCHRONOUS
  await TestValidator.error("async-error", async () => {
    throw new Error("Bug on TestValidator.error(): failed to catch error.");
  });
  await TestValidator.error("async-no-error", () =>
    TestValidator.error("async-no-error", async () => {}),
  );

  // SYNCHRONOUS
  TestValidator.error("error", () => {
    throw new Error("Bug on TestValidator.error(): failed to catch error.");
  });
  TestValidator.error("no-error", () =>
    TestValidator.error("no-error", () => {}),
  );
}
