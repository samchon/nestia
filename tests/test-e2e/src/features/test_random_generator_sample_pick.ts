import { RandomGenerator } from "@nestia/e2e";

/**
 * Verifies `RandomGenerator.sample()` selects distinct positions of the array
 * and `pick()` refuses an empty array.
 *
 * 1. Sample 5 of 10 elements many times, and assert each result has 5 distinct
 *    members of the array.
 * 2. Sample more than the array holds, and assert every element comes back once.
 * 3. Sample 0 elements and from an empty array, and assert both are empty, and
 *    that the input is left as it was.
 * 4. Assert `pick()` of an empty array throws a `RangeError`, and of one element
 *    returns it.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `RandomGenerator.sample()` and `pick()` and asserts the distinctness, membership, and completeness of the result and the `RangeError` on an empty array, which detects a sampler that repeats an element or drops one when asked for all.
 * @evidence contracts/testing.md#independent-expectations Sampling without replacement selects distinct positions, identified by the unique numeric values in the main fixture; the sorted full sample must equal that input. A complete sample of two equal-valued positions must retain both, so values are not deduplicated.
 * @evidence contracts/testing.md#distinguishing-cases Two hundred samples of 5 of 10, a request larger than the array, duplicate-valued positions, a request of 0, an empty array, an unchanged input, and pick of an empty and a single array are separate cases; randomness is bounded by the loop, not asserted as uniform.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export function test_random_generator_sample_pick(): void {
  const array: number[] = Array.from({ length: 10 }, (_, i) => i);
  for (let i: number = 0; i < 200; ++i) {
    const sampled: number[] = RandomGenerator.sample(array, 5);
    if (sampled.length !== 5 || new Set(sampled).size !== 5)
      throw new Error(`sample is not 5 distinct elements: ${sampled}.`);
    if (sampled.some((e) => array.includes(e) === false))
      throw new Error(`sample holds a stranger: ${sampled}.`);
  }
  const all: number[] = RandomGenerator.sample(array, 100);
  if (JSON.stringify([...all].sort((a, b) => a - b)) !== JSON.stringify(array))
    throw new Error(`a full sample lost elements: ${all}.`);
  if (RandomGenerator.sample(array, 0).length !== 0)
    throw new Error("sample of 0 is not empty.");
  if (RandomGenerator.sample([], 3).length !== 0)
    throw new Error("sample of an empty array is not empty.");
  if (
    JSON.stringify(RandomGenerator.sample(["same", "same"], 2)) !==
    JSON.stringify(["same", "same"])
  )
    throw new Error("sample deduplicated equal-valued input positions.");
  if (JSON.stringify(array) !== JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
    throw new Error("sample changed its input.");

  let error: unknown = null;
  try {
    RandomGenerator.pick([]);
  } catch (exp) {
    error = exp;
  }
  if (!(error instanceof RangeError))
    throw new Error(`pick([]) was not rejected: ${String(error)}.`);
  if (RandomGenerator.pick(["only"]) !== "only")
    throw new Error("pick of one element is not that element.");
}
