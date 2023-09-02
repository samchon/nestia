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
}
export namespace IRoute {
    export interface IBody {
        type: "application/json" | "text/plain";
        encrypted?: boolean;
    }
}
