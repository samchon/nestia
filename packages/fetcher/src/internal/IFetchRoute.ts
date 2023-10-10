/**
 * Properties of remote API route.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IFetchRoute<
    Method extends "HEAD" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
> {
    /**
     * Method of the HTTP request.
     */
    method: Method;

    /**
     * Path of the HTTP request.
     */
    path: string;

    /**
     * Request body data info.
     */
    request: Method extends "DELETE" | "POST" | "PUT" | "PATCH"
        ? IFetchRoute.IBody | null
        : null;

    /**
     * Response body data info.
     */
    response: Method extends "HEAD" ? null : IFetchRoute.IBody;

    /**
     * When special status code being used.
     */
    status: number | null;

    /**
     * Parser of the query string.
     *
     * If content type of response body is `application/x-www-form-urlencoded`,
     * then this `parseQuery` function would be called.
     *
     * If you've forgotten to configuring this `parseQuery` property about the
     * `application/x-www-form-urlencoded` typed response body data, then
     * only the `URLSearchParams` typed instance would be returned instead.
     */
    parseQuery?(input: URLSearchParams): any;
}
export namespace IFetchRoute {
    /**
     * Metadata of body.
     *
     * Describes how content-type being used in body, and whether encrypted or not.
     */
    export interface IBody {
        type:
            | "application/json"
            | "application/x-www-form-urlencoded"
            | "text/plain";
        encrypted?: boolean;
    }
}
