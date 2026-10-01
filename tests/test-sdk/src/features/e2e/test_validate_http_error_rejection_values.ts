import { TestValidator } from "@nestia/e2e";

/**
 * Verifies unusable HTTP-error values fail the status expectation in both
 * synchronous and asynchronous tasks.
 *
 * Null or absent constructors and throwing properties must not escape as a
 * property-access error or leave an asynchronous expectation pending.
 *
 * 1. Throw primitives, a function, null-prototype records and records whose
 *    constructor is absent, null or unreadable.
 * 2. Throw a named HTTP-error shape whose status getter is unreadable.
 * 3. Require the literal status-expectation error for every value and for a task
 *    that succeeds, in both task modes.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls the public HTTP-error validator with actual thrown values and requires its exact 404 expectation error. Unguarded constructor/property reads expose a different error, and malformed asynchronous rejections must settle rather than escape through an unhandled promise chain.
 * @evidence contracts/testing.md#independent-expectations None of the authored primitive or malformed-object values supplies a readable named HttpError with numeric status 404, so the literal failed-expectation message is expected; the throwing-property sentinel is separately authored and cannot satisfy that message.
 * @evidence contracts/testing.md#distinguishing-cases Null, undefined, string, number, boolean, bigint, symbol, function, absent/null constructors and throwing constructor/status getters run synchronously and asynchronously; successful tasks also fail. Named matching and mismatching HTTP errors remain in test_validate_http_error.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching test-sdk entry and awaits the direct in-process operation. A cleared three-second timer bounds each asynchronous expectation so an unsettled promise fails rather than hanging the suite; no server, child process, installed consumer, foreign method or global rejection handler is involved.
 */
export async function test_validate_http_error_rejection_values(): Promise<void> {
  const unreadable = (): never => {
    throw new Error("The thrown value's property cannot be read.");
  };
  const values: Array<[string, unknown]> = [
    ["null", null],
    ["undefined", undefined],
    ["string", "text"],
    ["number", 42],
    ["boolean", false],
    ["bigint", 1n],
    ["symbol", Symbol("thrown")],
    ["function", () => 1],
    ["null prototype", Object.create(null)],
    ["null constructor", { constructor: null }],
    ["undefined constructor", { constructor: undefined }],
    [
      "throwing constructor",
      Object.defineProperty({}, "constructor", { get: unreadable }),
    ],
    [
      "throwing status",
      Object.defineProperty({ constructor: { name: "HttpError" } }, "status", {
        get: unreadable,
      }),
    ],
  ];
  for (const [name, value] of values)
    for (const asynchronous of [false, true]) {
      const task = asynchronous
        ? async () => {
            throw value;
          }
        : () => {
            throw value;
          };
      let error: unknown;
      let deadline: ReturnType<typeof setTimeout> | undefined;
      try {
        const output = TestValidator.httpError("non-HTTP", 404, task);
        if (asynchronous)
          await Promise.race([
            output,
            new Promise<never>((_resolve, reject) => {
              deadline = setTimeout(
                () => reject(new Error("HTTP expectation did not settle.")),
                3_000,
              );
            }),
          ]);
        else await output;
      } catch (exp) {
        error = exp;
      } finally {
        if (deadline !== undefined) clearTimeout(deadline);
      }
      if (
        !(error instanceof Error) ||
        error.message !==
          "Bug on non-HTTP: status code must be 404, but succeeded."
      )
        throw new Error(
          `${name} (${asynchronous ? "async" : "sync"}) did not report the HTTP expectation: ${String(error)}.`,
        );
    }
  const successes: Array<() => number | Promise<number>> = [
    () => 1,
    async () => 1,
  ];
  for (const task of successes) {
    let error: unknown;
    try {
      await TestValidator.httpError("succeeds", 404, task);
    } catch (exp) {
      error = exp;
    }
    if (
      !(error instanceof Error) ||
      error.message !==
        "Bug on succeeds: status code must be 404, but succeeded."
    )
      throw new Error(
        `The successful task did not fail its HTTP expectation: ${String(error)}.`,
      );
  }
}
