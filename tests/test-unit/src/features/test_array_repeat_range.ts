import { ArrayUtil } from "@nestia/e2e";

/**
 * Verifies `ArrayUtil.repeat()` and `asyncRepeat()` reject a count that is not
 * an integer within JavaScript's array capacity, and call the closure once per
 * index, in order.
 *
 * Counts beyond 2^32 - 1 cannot produce a JavaScript array and must be rejected
 * before callback side effects. Throwing callbacks test both sides of that
 * capacity boundary without allocating billions of entries.
 *
 * 1. Repeat 3 times and assert the indexes are 0, 1, 2 in order, sync and async.
 * 2. Repeat 0 times and assert the result is empty.
 * 3. Repeat 100000 times and assert every returned index remains in order.
 * 4. Assert negative, fractional, non-finite, unsafe and over-capacity counts
 *    throw a `RangeError` before calling the callback.
 * 5. Assert the exact capacity is accepted by observing a callback sentinel.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls both public repetition operations and asserts ordered callback results and no callbacks for invalid counts; accepting 2^32 reaches the immediate sentinel and fails safely instead of allocating an impossible result, while the exact maximum must reach that sentinel once.
 * @evidence contracts/testing.md#independent-expectations The literal indexes 0, 1, 2 and each returned index follow from repeating the identity callback; JavaScript's array length range independently establishes the accepted 2^32 - 1 boundary and rejected 2^32 boundary, and the authored sentinel distinguishes callback execution from validation.
 * @evidence contracts/testing.md#distinguishing-cases Both synchronous and asynchronous operations cover ordinary, empty, 100000-element, negative, fractional, NaN, infinite, unsafe, over-capacity and exact-capacity counts; throwing callbacks bound the capacity probes to one invocation and empty callbacks must never run.
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
  const unexpected = (): never => {
    throw new Error("The empty repetition invoked its callback.");
  };
  if (ArrayUtil.repeat(0, unexpected).length !== 0)
    throw new Error("repeat(0) is not empty.");
  if ((await ArrayUtil.asyncRepeat(0, async () => unexpected())).length !== 0)
    throw new Error("asyncRepeat(0) is not empty.");
  for (const actual of [
    ArrayUtil.repeat(100_000, (i) => i),
    await ArrayUtil.asyncRepeat(100_000, async (i) => i),
  ])
    if (
      actual.length !== 100_000 ||
      actual.some((value, index) => value !== index)
    )
      throw new Error("The large repetition lost or reordered elements.");
  for (const count of [
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    0x100000000,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER + 1,
    0xffffffff,
  ])
    for (const asynchronous of [false, true]) {
      let calls = 0;
      const sentinel = new Error("The capacity probe reached its callback.");
      const callback = (): never => {
        ++calls;
        throw sentinel;
      };
      let error: unknown = null;
      try {
        if (asynchronous)
          await ArrayUtil.asyncRepeat(count, async () => callback());
        else ArrayUtil.repeat(count, callback);
      } catch (exp) {
        error = exp;
      }
      if (count === 0xffffffff) {
        if (error !== sentinel || calls !== 1)
          throw new Error("The exact array capacity was not accepted.");
      } else if (!(error instanceof RangeError) || calls !== 0)
        throw new Error(`count ${count} was not rejected: ${String(error)}.`);
    }
}
