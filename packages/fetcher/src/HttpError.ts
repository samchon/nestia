/**
 * HTTP Error.
 *
 * `HttpError` is a type of error class who've been thrown by the remote HTTP server.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class HttpError extends Error {
  /**
   * @internal
   */
  private body_: any = NOT_YET;

  /**
   * Initializer Constructor.
   *
   * @param method Method of the HTTP request.
   * @param path Path of the HTTP request.
   * @param status Status code from the remote HTTP server.
   * @param message Error message from the remote HTTP server.
   */
  public constructor(
    public readonly method:
      | "GET"
      | "DELETE"
      | "POST"
      | "PUT"
      | "PATCH"
      | "HEAD",
    public readonly path: string,
    public readonly status: number,
    public readonly headers: Record<string, string | string[]>,
    message: string,
  ) {
    super(message);

    // INHERITANCE POLYFILL
    const proto: HttpError = new.target.prototype;
    if (Object.setPrototypeOf) Object.setPrototypeOf(this, proto);
    else (this as any).__proto__ = proto;
  }

  /**
   * `HttpError` to JSON.
   *
   * When you call `JSON.stringify()` function on current `HttpError` instance,
   * this `HttpError.toJSON()` method would be automatically called.
   *
   * Also, if response body from the remote HTTP server forms a JSON object,
   * this `HttpError.toJSON()` method would be useful because it returns the
   * parsed JSON object about the {@link message} property.
   *
   * @template T Expected type of the response body.
   * @returns JSON object of the `HttpError`.
   */
  public toJSON<T>(): HttpError.IProps<T> {
    if (this.body_ === NOT_YET)
      try {
        this.body_ = JSON.parse(this.message);
      } catch {
        this.body_ = this.message;
      }
    return {
      method: this.method,
      path: this.path,
      status: this.status,
      headers: this.headers,
      message: this.body_,
    };
  }
}
export namespace HttpError {
  /**
   * Returned type of {@link HttpError.toJSON} method.
   */
  export interface IProps<T> {
    method: "GET" | "DELETE" | "POST" | "PUT" | "PATCH" | "HEAD";
    path: string;
    status: number;
    headers: Record<string, string | string[]>;
    message: T;
  }
}

const NOT_YET = {} as any;
