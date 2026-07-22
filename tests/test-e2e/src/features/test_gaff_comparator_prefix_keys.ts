import { GaffComparator, TestValidator } from "@nestia/e2e";

export async function test_gaff_comparator_prefix_keys(): Promise<void> {
  const strings = GaffComparator.strings<{ value: string[] }>((x) => x.value);
  const dates = GaffComparator.dates<{ value: string[] }>((x) => x.value);
  const numbers = GaffComparator.numbers<{ value: number[] }>((x) => x.value);

  TestValidator.predicate(
    "string prefix",
    strings({ value: ["a"] }, { value: ["a", "b"] }) < 0,
  );
  TestValidator.predicate(
    "date prefix",
    dates({ value: ["2026-01-01T00:00:00.000Z"] }, {
      value: ["2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"],
    }) < 0,
  );
  TestValidator.predicate(
    "number prefix",
    numbers({ value: [1] }, { value: [1, 2] }) < 0,
  );
}
