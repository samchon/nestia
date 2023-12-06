import { ArrayUtil } from "../../ArrayUtil";

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
