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
        ? IRoute.IBody | null
        : null;

    /**
     * Response body data info.
     */
    response: Method extends "HEAD" ? null : IRoute.IBody;

    /**
     * When special status code being used.
     */
    status: number | null;

    /**
     * Parser of the query string.
     *
     * If content type of response body is `application/x-www-form-urlencoded`,
     * then this `query` function would be called.
     *
     * If you've forgotten to configuring this property about the
     * `application/x-www-form-urlencoded` typed response body data,
     * then `URLSearchParams` instance would be returned instead.
     */
    parseQuery?(input: URLSearchParams): any;
}
export namespace IRoute {
    export interface IBody {
        type:
            | "application/json"
            | "application/x-www-form-urlencoded"
            | "text/plain";
        encrypted?: boolean;
    }
}
