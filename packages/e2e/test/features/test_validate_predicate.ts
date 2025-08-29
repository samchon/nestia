import { TestValidator } from "@nestia/e2e";

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
}
