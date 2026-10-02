import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies arrayUtil.subsets enumerates the complete powerset without
 * duplicates.
 *
 * Six distinct inputs have exactly 2^6 subsets by independent subset
 * cardinality.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert the nonempty six-element case checks count and uniqueness; empty and
 *    singleton cases are added as boundary controls.
 */
export function test_array_subsets(): void {
  const array: number[] = new Array(6).fill(0).map((_, i) => i);
  const subsets: number[][] = ArrayUtil.subsets(array);

  if (subsets.length !== 2 ** 6)
    throw new Error("Bug on ArrayUtil.subsets(): invalid count.");

  const expected = new Set<string>();
  for (let mask = 0; mask < 2 ** array.length; ++mask)
    expected.add(array.filter((_, i) => (mask & (1 << i)) !== 0).join(","));
  const set: Set<string> = new Set();
  for (const elements of subsets)
    set.add(elements.sort((a, b) => a - b).join(","));

  if ([...set].some((value) => !expected.has(value)))
    throw new Error("ArrayUtil.subsets emitted a subset outside the powerset.");
  if (JSON.stringify(ArrayUtil.subsets([])) !== "[[]]")
    throw new Error("The empty array must have one empty subset.");
  const singleton = ArrayUtil.subsets([7])
    .map((x) => x.join(","))
    .sort();
  if (JSON.stringify(singleton) !== '["","7"]')
    throw new Error("A singleton must have empty and singleton subsets.");
  if (set.size !== subsets.length)
    throw new Error("Bug on ArrayUtil.subsets(): invalid elements.");
}
