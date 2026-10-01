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
 * @evidence contracts/testing.md#behavioral-verification It calls `PathParameter.encode()` and asserts the encoded text and the throw for the dot segments, which a plain `encodeURIComponent` leaves as `.` and `..`.
 * @evidence contracts/testing.md#independent-expectations The expected encodings are literal strings that follow from RFC 3986 percent-encoding and from a URL parser resolving dot segments, listed in the table of cases.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary, nullish, boolean, bigint, number, percent, slash-bearing, and dot-bearing values that are no dot segment are the negative rows; `.` and `..` are the positive rows that must throw naming the parameter.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, and drives the `@nestia/fetcher` operation in-process with a stubbed `connection.fetch`, so no server or socket is involved.
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
