import { TestValidator } from "../../TestValidator";

export async function test_validate_http_error(): Promise<void> {
  // ASYNCHRONOUS
  await TestValidator.httpError("async-400-error")(400)(async () => {
    throw new HttpError("GET", "/", 400, "400 error");
  });
  await TestValidator.error("async-no-400-error")(() =>
    TestValidator.httpError("async-no-400-error")(400)(async () => {
      throw new HttpError("GET", "/", 500, "400 error");
    }),
  );
  await TestValidator.error("async-no-http-error")(() =>
    TestValidator.httpError("async-no-http-error")(400)(async () => {
      throw new Error("internal server error");
    }),
  );

  // SYNCHRONOUS
  TestValidator.httpError("400-error")(400)(() => {
    throw new HttpError("GET", "/", 400, "400 error");
  });
  TestValidator.error("no-400-error")(() =>
    TestValidator.httpError("no-400-error")(400)(() => {
      throw new HttpError("GET", "/", 500, "400 error");
    }),
  );
  TestValidator.error("no-http-error")(() =>
    TestValidator.httpError("no-http-error")(400)(() => {
      throw new Error("internal server error");
    }),
  );
}

class HttpError extends Error {
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
