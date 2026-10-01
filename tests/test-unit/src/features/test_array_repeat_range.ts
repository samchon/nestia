import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies `ArrayUtil.repeat()` and `asyncRepeat()` reject a count that is not
 * a non-negative integer, and call the closure once per index, in order.
 *
 * The functions were recursive, so a large count overflowed the stack and a
 * negative or fractional count did not terminate as a count would.
 *
 * 1. Repeat 3 times and assert the indexes are 0, 1, 2 in order, sync and async.
 * 2. Repeat 0 times and assert the result is empty.
 * 3. Repeat 100000 times and assert the stack holds.
 * 4. Assert -1, 1.5, and NaN throw a `RangeError`.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `ArrayUtil.repeat()` and `asyncRepeat()` and asserts the indexes given to the closure, the result length, and the `RangeError` for a bad count; a recursive implementation overflows the stack at 100000 and one without validation accepts -1.
 * @evidence contracts/testing.md#independent-expectations The expected indexes 0, 1, 2 and the length 100000 follow from the meaning of repeating a closure `count` times, and the rejected counts -1, 1.5, and NaN follow from a count being a non-negative integer.
 * @evidence contracts/testing.md#distinguishing-cases Cases are ordinary, empty, very large, negative, fractional, and NaN counts, for both the synchronous and the asynchronous function; the sync and async results are compared with the same literal.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_array_repeat_range(): Promise<void> {
  const order = (title: string, actual: number[]): void => {
    if (JSON.stringify(actual) !== JSON.stringify([0, 1, 2]))
      throw new Error(`${title}: indexes ${JSON.stringify(actual)}.`);
  };
  order(
    "repeat",
    ArrayUtil.repeat(3, (i) => i),
  );
  order("asyncRepeat", await ArrayUtil.asyncRepeat(3, async (i) => i));
  if (ArrayUtil.repeat(0, () => 1).length !== 0)
    throw new Error("repeat(0) is not empty.");
  if ((await ArrayUtil.asyncRepeat(0, async () => 1)).length !== 0)
    throw new Error("asyncRepeat(0) is not empty.");
  if (ArrayUtil.repeat(100_000, (i) => i).length !== 100_000)
    throw new Error("repeat(100000) lost elements.");
  if ((await ArrayUtil.asyncRepeat(100_000, async (i) => i)).length !== 100_000)
    throw new Error("asyncRepeat(100000) lost elements.");
  for (const count of [-1, 1.5, Number.NaN])
    for (const run of [
      () => ArrayUtil.repeat(count, () => 1),
      () => ArrayUtil.asyncRepeat(count, async () => 1),
    ]) {
      let error: unknown = null;
      try {
        await run();
      } catch (exp) {
        error = exp;
      }
      if (!(error instanceof RangeError))
        throw new Error(`count ${count} was not rejected: ${String(error)}.`);
    }
}
