/**
 * The path parameters of a generated SDK function, as its URL carries them.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation A path parameter is one URL path segment, so the value must be encoded as one segment and must never spell a dot segment, which the URL parser would resolve away.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with one function, kept apart so both the SDK generator's output and hand-written callers use the same rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule applies to every value; no parameter name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states the purpose of the namespace and the function documents the dot-segment refusal.
 */
export namespace PathParameter {
  /**
   * The parameter's value as one URL path segment: its text URI-encoded, or
   * `"null"` when the value is nullish.
   *
   * `.` and `..` are refused. `encodeURIComponent` leaves them as they are, and
   * the URL parser that `fetch` and `new URL()` share resolves them as dot
   * segments, so the request would reach the parent path instead of the route,
   * with the value gone. Their percent-encoded form is a dot segment by the
   * same standard, so no spelling carries them.
   *
   * @param name Name of the parameter, for the error
   * @param value Value of the parameter
   * @returns The URI-encoded segment
   * @throws Error when the value is `.` or `..`
   * @evidence contracts/common.md#principled-implementation encodeURIComponent produces a single segment for well-formed Unicode text and throws URIError for unpaired surrogates; nullish input becomes the text null. The encoded text . or .. is refused because the WHATWG URL parser treats it and its percent-encoded spelling as a dot segment.
   * @evidence contracts/common.md#clear-and-simple-design One conversion and one guard, with the reason for the guard stated in the comment.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The guard prevents a request from silently reaching a different route, so it is a correctness check rather than a workaround for a test.
   * @evidence contracts/common.md#meaningful-documentation The comment states the encoding, the nullish rule, the refused segments, their reason, and the thrown error.
   */
  export const encode = (name: string, value: unknown): string => {
    const encoded: string = encodeURIComponent(
      value === null || value === undefined ? "null" : String(value),
    );
    if (encoded === "." || encoded === "..")
      throw new Error(
        `Error on PathParameter.encode(): path parameter "${name}" is ${JSON.stringify(encoded)}, a dot segment the URL resolves away, which would send the request to another path.`,
      );
    return encoded;
  };
}
