import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies `ArrayUtil.has()` reports whether any element satisfies the
 * predicate, whatever the element is.
 *
 * It compared `find()` with `undefined`, so an array whose satisfying element
 * is itself `undefined` reported `false` (#1712).
 *
 * 1. Assert a satisfying `undefined`, `null`, `0`, and `false` are found.
 * 2. Assert no satisfying element, and an empty array, report `false`.
 */
export function test_array_has(): void {
  const cases: Array<[string, boolean, boolean]> = [
    ["undefined", ArrayUtil.has([undefined], (e) => e === undefined), true],
    ["null", ArrayUtil.has([1, null], (e) => e === null), true],
    ["zero", ArrayUtil.has([1, 0], (e) => e === 0), true],
    ["false", ArrayUtil.has([true, false], (e) => e === false), true],
    ["none", ArrayUtil.has([1, 2], (e) => e === 3), false],
    ["empty", ArrayUtil.has([], () => true), false],
  ];
  for (const [title, actual, expected] of cases)
    if (actual !== expected)
      throw new Error(
        `Bug on ArrayUtil.has(): ${title} gives ${actual}, not ${expected}.`,
      );
}
