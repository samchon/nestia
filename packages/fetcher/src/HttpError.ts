/**
 * HTTP Error.
 *
 * `HttpError` is a type of error class who've been thrown by the remote HTTP server.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class HttpError extends Error {
    /**
     * Initializer Constructor.
     *
     * @param method Method of the HTTP request.
     * @param path Path of the HTTP request.
     * @param status Status code from the remote HTTP server.
     * @param message Error message from the remote HTTP server.
     */
    public constructor(
        public readonly method: "GET" | "DELETE" | "POST" | "PUT" | "PATCH",
        public readonly path: string,
        public readonly status: number,
        message: string,
    ) {
        super(message);

        // INHERITANCE POLYFILL
        const proto: HttpError = new.target.prototype;
        if (Object.setPrototypeOf) Object.setPrototypeOf(this, proto);
        else (this as any).__proto__ = proto;
    }
}
