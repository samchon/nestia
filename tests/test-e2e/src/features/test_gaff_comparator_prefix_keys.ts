import { GaffComparator, TestValidator } from "@nestia/e2e";

/**
 * Verifies each comparator orders a proper prefix of key lists before its
 * extension, in both argument orders.
 *
 * The comparators walked the first list, so with the longer one first they
 * compared a key against `undefined`: `strings` answered -1 both ways, and
 * `numbers` and `dates` answered NaN, which `TestValidator.sort` read as sorted
 * (#1681).
 *
 * @evidence contracts/testing.md#behavioral-verification GaffComparator strings, dates and numbers consistently order key-list prefixes.
 * @evidence contracts/testing.md#independent-expectations Lexicographic ordering puts a proper prefix before its extension and reversing arguments negates the sign.
 * @evidence contracts/testing.md#distinguishing-cases All three comparators exercise both prefix operand orders and antisymmetry.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
 */

export async function test_gaff_comparator_prefix_keys(): Promise<void> {
  const strings = GaffComparator.strings<{ value: string[] }>((x) => x.value);
  const dates = GaffComparator.dates<{ value: string[] }>((x) => x.value);
  const numbers = GaffComparator.numbers<{ value: number[] }>((x) => x.value);
  const check = <T>(
    title: string,
    comparator: (x: T, y: T) => number,
    shorter: T,
    longer: T,
  ): void => {
    const forward: number = comparator(shorter, longer);
    const backward: number = comparator(longer, shorter);
    TestValidator.predicate(`${title} prefix first`, forward < 0);
    TestValidator.predicate(`${title} extension last`, backward > 0);
    TestValidator.equals(`${title} antisymmetric`, backward, -forward);
  };
  check("string", strings, { value: ["abc"] }, { value: ["abc", "a"] });
  check(
    "date",
    dates,
    { value: ["2026-01-01T00:00:00.000Z"] },
    { value: ["2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"] },
  );
  check("number", numbers, { value: [1] }, { value: [1, 2] });
}
