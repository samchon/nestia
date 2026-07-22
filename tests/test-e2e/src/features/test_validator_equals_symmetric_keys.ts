import { TestValidator } from "@nestia/e2e";

export async function test_validator_equals_symmetric_keys(): Promise<void> {
  TestValidator.equals("equal nested values", { nested: { value: 1 } }, {
    nested: { value: 1 },
  });
  TestValidator.error("actual-only property", () =>
    TestValidator.equals("extra property", { value: 1 }, {
      value: 1,
      leaked: true,
    }),
  );
  TestValidator.error("object and array", () =>
    TestValidator.equals("different shapes", {}, []),
  );
  TestValidator.equals(
    "ignored property",
    { value: 1, ignored: "expected" },
    { value: 1, ignored: "actual" },
    (key) => key === "ignored",
  );
}
