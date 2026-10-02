import { PathParameter } from "@nestia/fetcher";

/**
 * Verifies `PathParameter.encode()` URI-encodes a path parameter and refuses
 * the dot segments no URL path can carry.
 *
 * SDK path functions encoded each parameter with `encodeURIComponent`, which
 * leaves `.` and `..` as they are, and the URL parser `fetch` uses resolved
 * them away, so the request reached the parent route (#1714).
 *
 * 1. Assert ordinary values, nullish ones, and dot-bearing ones that are no dot
 *    segment encode as `encodeURIComponent` does.
 * 2. Assert `.` and `..` throw, naming the parameter.
 *
 * @evidence contracts/testing.md#behavioral-verification PathParameter.encode encodes scalar values and rejects dot path segments.
 * @evidence contracts/testing.md#independent-expectations URI component encoding and URL dot-segment semantics establish the literal expectations independently.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary and escaped strings, empty, numeric, bigint, boolean and nullish values are accepted; dot and double-dot must fail with the parameter name.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
 */

export function test_fetcher_path_parameter(): void {
  const cases: Array<[unknown, string]> = [
    ["abc", "abc"],
    ["a/b", "a%2Fb"],
    ["%2e", "%252e"],
    ["a/..", "a%2F.."],
    ["../x", "..%2Fx"],
    ["...", "..."],
    ["", ""],
    [1.5, "1.5"],
    [BigInt(12), "12"],
    [true, "true"],
    [null, "null"],
    [undefined, "null"],
  ];
  for (const [value, expected] of cases) {
    const actual: string = PathParameter.encode("id", value);
    if (actual !== expected)
      throw new Error(
        `Bug on PathParameter.encode(): ${String(value)} gives ${actual}, not ${expected}.`,
      );
  }
  for (const value of [".", ".."]) {
    const error: unknown = (() => {
      try {
        PathParameter.encode("id", value);
      } catch (exp) {
        return exp;
      }
      return null;
    })();
    if (!(error instanceof Error) || error.message.includes('"id"') === false)
      throw new Error(
        `Bug on PathParameter.encode(): ${value} is not refused by its name.`,
      );
  }
}
