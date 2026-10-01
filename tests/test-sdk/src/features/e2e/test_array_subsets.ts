import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies `ArrayUtil.subsets()` returns every subset of an array exactly once.
 *
 * 1. Take the subsets of an array of 6 elements.
 * 2. Assert there are 2^6 of them and that, once normalized, no two are equal.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `ArrayUtil.subsets()` and asserts the number of subsets and that they are pairwise distinct, so a duplicate, missing, or extra subset is detected.
 * @evidence contracts/testing.md#independent-expectations The count 2^n and the distinctness of subsets follow from the definition of a power set, not from running the implementation twice.
 * @evidence contracts/testing.md#distinguishing-cases One six-element array separates the correct 64 distinct subsets from a repeated or truncated enumeration; the order of subsets is owned by `test_array_subsets_order`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export function test_array_subsets(): void {
  const array: number[] = new Array(6).fill(0).map((_, i) => i);
  const subsets: number[][] = ArrayUtil.subsets(array);

  if (subsets.length !== 2 ** 6)
    throw new Error("Bug on ArrayUtil.subsets(): invalid count.");

  const set: Set<string> = new Set();
  for (const elements of subsets)
    set.add(elements.sort((a, b) => a - b).join(","));

  if (set.size !== subsets.length)
    throw new Error("Bug on ArrayUtil.subsets(): invalid elements.");
}
