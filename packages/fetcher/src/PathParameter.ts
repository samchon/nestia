/**
 * The path parameters of a generated SDK function, as its URL carries them.
 *
 * @author Jeongho Nam - https://github.com/samchon
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
