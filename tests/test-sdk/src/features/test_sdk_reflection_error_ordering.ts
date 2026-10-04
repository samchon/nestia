import assert from "node:assert/strict";
import { TreeMap } from "tstl";

import { IReflectOperationError } from "../../../../packages/sdk/lib/structures/IReflectOperationError";

/**
 * Verifies nullable diagnostic fields keep a strict weak ordering.
 *
 * Null and empty function names share the documented normalized spelling. Their
 * origin fields must still distinguish diagnostic groups; comparing the raw
 * function fields first used to make equivalence non-transitive.
 *
 * 1. Contrast null and empty function names with equal and different origins.
 * 2. Insert the same three diagnostic origins in every permutation.
 * 3. Require the tree map to retain all groups in lexical origin order.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual diagnostic-key comparator preserves null/empty equivalence and strict weak ordering; all six insert orders retain all three origins.
 * @evidence contracts/testing.md#independent-expectations Literal a/m/z origins and normalized null/empty spellings define lexical ordering independently of the comparator.
 * @evidence contracts/testing.md#distinguishing-cases Equal, distinct, null, empty and reflexive keys plus every three-key insertion permutation retain all original comparisons.
 * @evidence contracts/testing.md#execution-ownership The canonical SDK unit entry calls the caller-built key operation and TreeMap directly with authored records; no CLI, compiler, installation or host executes.
 */
export function test_sdk_reflection_error_ordering(): void {
  const key = (name: string | null, from: string | null) =>
    new IReflectOperationError.Key({
      file: "source.ts",
      class: "Controller",
      function: name,
      from,
      contents: [],
    });
  const first = key(null, "a");
  const middle = key(null, "m");
  const last = key("", "z");
  assert.equal(first.less(last), true);
  assert.equal(last.less(first), false);
  assert.equal(first.less(key("", "a")), false);
  assert.equal(key("", "a").less(first), false);
  assert.equal(key(null, null).less(first), true);
  assert.equal(key(null, null).less(key("", "")), false);
  assert.equal(key("", "").less(key(null, null)), false);
  for (const entry of [first, middle, last])
    assert.equal(entry.less(entry), false);
  assert.equal(first.less(middle), true);
  assert.equal(middle.less(last), true);
  for (const order of [
    [first, middle, last],
    [first, last, middle],
    [middle, first, last],
    [middle, last, first],
    [last, first, middle],
    [last, middle, first],
  ]) {
    const map = new TreeMap<IReflectOperationError.Key, string | null>();
    for (const entry of order) map.emplace(entry, entry.error.from);
    assert.deepEqual(
      Array.from(map, (entry) => entry.second),
      ["a", "m", "z"],
    );
  }
}
