import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies `ArrayUtil.subsets()` lists each element as included before
 * excluded, so the whole array comes first and the empty subset last.
 *
 * 1. Take the subsets of `[1, 2, 3]`.
 * 2. Assert the exact list and its order, which holds 2^3 subsets.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `ArrayUtil.subsets()` on `[1, 2, 3]` and compares the exact list with its order, which distinguishes the documented depth-first order from any other enumeration of the same subsets.
 * @evidence contracts/testing.md#independent-expectations The expected list is written out literally from the documented rule that each element is included before it is excluded, so the whole array comes first and the empty subset last.
 * @evidence contracts/testing.md#distinguishing-cases The single three-element input has every decision of the order: all included, the last excluded, only the first kept, and none; distinctness and count are owned by `test_array_subsets`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export function test_array_subsets_order(): void {
  const actual: string = JSON.stringify(ArrayUtil.subsets([1, 2, 3]));
  const expected: string = JSON.stringify([
    [1, 2, 3],
    [1, 2],
    [1, 3],
    [1],
    [2, 3],
    [2],
    [3],
    [],
  ]);
  if (actual !== expected) throw new Error(`subsets order: ${actual}.`);
}
