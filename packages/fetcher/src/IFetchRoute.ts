/**
 * Properties of remote API route.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IFetchRoute<
  Method extends "HEAD" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
> {
  /** Method of the HTTP request. */
  method: Method;

  /** Path of the HTTP request. */
  path: string;

  /**
   * Path template.
   *
   * Filled since 3.2.2 version.
   */
  template?: string;

  /** Request body data info. */
  request: Method extends "DELETE" | "POST" | "PUT" | "PATCH"
    ? IFetchRoute.IBody | null
    : null;

  /** Response body data info. */
  response: Method extends "HEAD" ? null : IFetchRoute.IBody;

  /** When special status code being used. */
  status: number | null;

  /**
   * Parser of the query string.
   *
   * If content type of response body is `application/x-www-form-urlencoded`,
   * then this `parseQuery` function would be called.
   *
   * If you've forgotten to configuring this `parseQuery` property about the
   * `application/x-www-form-urlencoded` typed response body data, then only the
   * `URLSearchParams` typed instance would be returned instead.
   *
   * @evidence contracts/common.md#principled-implementation A response of type `application/x-www-form-urlencoded` is parsed with the route's function when there is one and is returned as `URLSearchParams` otherwise.
   * @evidence contracts/common.md#clear-and-simple-design One optional method with one argument.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The parser is route data supplied by the generated SDK, with no default guess about the shape.
   * @evidence contracts/common.md#meaningful-documentation The comment states when it is called and what happens without it.
   */
  parseQuery?(input: URLSearchParams): any;
}
/**
 * Support types of {@link IFetchRoute}: the metadata of a request or response
 * body.
 *
 * @evidence contracts/common.md#principled-implementation The conditional member types encode HTTP: only `DELETE`, `POST`, `PUT`, and `PATCH` requests may have a body, and `HEAD` responses have none, so a route that contradicts its method does not compile.
 * @evidence contracts/common.md#clear-and-simple-design A record of the route facts the pipeline needs (method, path, optional template, bodies, status, query parser), with the nested body metadata in the namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation Each member documents its meaning, including that the template exists since version 3.2.2.
 */
export namespace IFetchRoute {
  /**
   * Metadata of body.
   *
   * Describes how content-type being used in body, and whether encrypted or
   * not.
   *
   * @evidence contracts/common.md#principled-implementation A body is described by its content type, which selects the encoding, and by whether it is encrypted, which selects the fetcher; the union keeps the common types visible while allowing any other string.
   * @evidence contracts/common.md#clear-and-simple-design Two fields, one of them optional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states that it describes the content type and the encryption.
   */
  export interface IBody {
    type:
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain"
      | (string & {});
    encrypted?: boolean;
  }
}
