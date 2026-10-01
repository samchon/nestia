import { GaffComparator, TestValidator } from "@nestia/e2e";

/**
 * Verifies string key lists advance past collation-equal Unicode spellings.
 *
 * Strict string inequality does not imply a different collation position.
 * Stopping at such a key incorrectly returns a tie and loses secondary keys or
 * proper-prefix ordering, although the platform's scalar comparison is
 * correct.
 *
 * 1. Retain ordinary scalar, strict-prefix and empty-array controls.
 * 2. Compare canonical Latin, Hangul and combining-mark-order equivalents.
 * 3. Require scalar/vector ties and later-key/prefix ordering in both directions.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls the public strings comparator with unequal Unicode spellings that collate equally and requires later keys or lengths to decide the result. Literal sign/tie assertions distinguish strict mismatch short circuiting from lexicographic collation.
 * @evidence contracts/testing.md#independent-expectations ECMA-402 CompareStrings requires canonical-equivalent spellings to compare equal. The authored equivalent pairs and ordinary a/b ordering establish ties and later-key signs independently of nestia's mismatch operation; no locale, comparison method or global is replaced.
 * @evidence contracts/testing.md#distinguishing-cases Empty arrays, an empty/nonempty pair, ordinary scalar and both strict-prefix orders are controls. Three canonical-equivalent pairs cover scalar ties, equal vectors, secondary-key precedence and proper-prefix order in both directions. Existing prefix-key tests retain number/date coverage.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching test-unit export and invokes the shipped e2e comparator in-process; no consumer installation, native build or server is needed by the case.
 */
export const test_gaff_comparator_collation_keys = (): void => {
  const compare = GaffComparator.strings<string | string[]>((value) => value);
  TestValidator.predicate("ordinary scalar", compare("a", "b") < 0);
  TestValidator.equals("empty tie", compare([], []), 0);
  TestValidator.predicate("empty first", compare([], ["a"]) < 0);
  TestValidator.predicate("empty reverse", compare(["a"], []) > 0);
  TestValidator.predicate("strict prefix", compare(["a"], ["a", "b"]) < 0);
  TestValidator.predicate(
    "strict prefix reverse",
    compare(["a", "b"], ["a"]) > 0,
  );
  for (const [title, left, right] of [
    ["Latin", "\u00e9", "e\u0301"],
    ["Hangul", "\uac00", "\u1100\u1161"],
    ["combining order", "a\u0301\u0323", "a\u0323\u0301"],
  ] as const) {
    TestValidator.equals(`${title} scalar tie`, compare(left, right), 0);
    TestValidator.equals(
      `${title} vector tie`,
      compare([left, "a"], [right, "a"]),
      0,
    );
    TestValidator.predicate(
      `${title} secondary`,
      compare([left, "b"], [right, "a"]) > 0,
    );
    TestValidator.predicate(
      `${title} secondary reverse`,
      compare([right, "a"], [left, "b"]) < 0,
    );
    TestValidator.predicate(
      `${title} prefix`,
      compare([left], [right, "x"]) < 0,
    );
    TestValidator.predicate(
      `${title} prefix reverse`,
      compare([right, "x"], [left]) > 0,
    );
  }
};
