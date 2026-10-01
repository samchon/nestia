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
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `ArrayUtil.has()` and asserts its boolean result; a defect that compares `find()` with `undefined` reports a satisfying `undefined` element as absent, and that is what the first assertion distinguishes.
 * @evidence contracts/testing.md#independent-expectations The expected answers follow from the meaning of `has`: some element satisfies the predicate. Each row states its expected boolean literally, not by re-running `find`.
 * @evidence contracts/testing.md#distinguishing-cases Positive rows are a satisfying `undefined`, `null`, `0`, and `false`; the negative rows are an array with no satisfying element and an empty array, so a `has` that always answers true fails them.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
