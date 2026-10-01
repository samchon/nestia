import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `TestValidator.httpError()` passes only a thrown HTTP error of the
 * expected status, synchronously and asynchronously.
 *
 * 1. Throw an HTTP error of status 400 and expect 400.
 * 2. Throw one of status 500, and a plain error, and expect failures.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `TestValidator.httpError()` with tasks throwing an error of the expected status, another status, and a non-HTTP error, and asserts acceptance or failure.
 * @evidence contracts/testing.md#independent-expectations The expected verdicts follow from the contract that the status must match an `HttpError`, and the errors are built in the test with a local class of the same name.
 * @evidence contracts/testing.md#distinguishing-cases Matching, mismatching, and non-HTTP errors are each tried synchronously and asynchronously; primitive and malformed-object throws are owned by test_validate_http_error_rejection_values.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_validate_http_error(): Promise<void> {
  // ASYNCHRONOUS
  await TestValidator.httpError("async-400-error", 400, async () => {
    throw new HttpError("GET", "/", 400, "400 error");
  });
  await TestValidator.error("async-no-400-error", () =>
    TestValidator.httpError("async-no-400-error", 400, async () => {
      throw new HttpError("GET", "/", 500, "400 error");
    }),
  );
  await TestValidator.error("async-no-http-error", () =>
    TestValidator.httpError("async-no-http-error", 400, async () => {
      throw new Error("internal server error");
    }),
  );

  // SYNCHRONOUS
  TestValidator.httpError("400-error", 400, () => {
    throw new HttpError("GET", "/", 400, "400 error");
  });
  TestValidator.error("no-400-error", () =>
    TestValidator.httpError("no-400-error", 400, () => {
      throw new HttpError("GET", "/", 500, "400 error");
    }),
  );
  TestValidator.error("no-http-error", () =>
    TestValidator.httpError("no-http-error", 400, () => {
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
