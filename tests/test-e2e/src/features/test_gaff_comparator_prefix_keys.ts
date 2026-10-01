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
 * 1. Compare string, date and number key lists with their proper extensions.
 * 2. Reverse each pair and require the opposite order.
 * 3. Require antisymmetric length differences for the equal prefixes.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `GaffComparator.strings()`, `dates()`, and `numbers()` on a key list and its extension in both argument orders and asserts sign and antisymmetry, which detects a comparator that walks the first list only and answers -1 both ways or NaN.
 * @evidence contracts/testing.md#independent-expectations A proper prefix orders before its extension is the lexicographic contract, and the antisymmetry `f(y, x) = -f(x, y)` is a mathematical property, neither taken from the implementation.
 * @evidence contracts/testing.md#distinguishing-cases Three comparators each get a prefix pair in both orders, so the forward, the backward, and the symmetric cases are separate assertions; sorting by keys that differ at their first element goes through the same comparators in `test_validate_sort`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
