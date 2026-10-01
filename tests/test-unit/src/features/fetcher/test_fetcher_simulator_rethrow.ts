import { HttpError, NestiaSimulator } from "@nestia/fetcher";

/**
 * Verifies the simulator turns only a typia type guard error into a 400, and
 * rethrows everything else as it was, including a thrown `null`.
 *
 * The type guard test read members of the thrown value, so throwing `null` or a
 * string raised a `TypeError` in place of the value the task threw.
 *
 * 1. Run a body assertion whose task throws a type-guard-shaped error, and assert
 *    an `HttpError` of status 400 whose body names the expectation.
 * 2. Run tasks that throw `null`, a string, and a plain error, and assert each
 *    surfaces exactly as thrown.
 * 3. Run a task that returns, and assert it passes.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the body assertion of `NestiaSimulator` with a task throwing a type-guard-shaped error and asserts an `HttpError` of status 400, then with tasks throwing `null`, a string, and a plain error and asserts each surfaces unchanged.
 * @evidence contracts/testing.md#independent-expectations Only a validation failure becomes a 400 and any other throw belongs to the caller; the assertions compare identity with the thrown value.
 * @evidence contracts/testing.md#distinguishing-cases The guard-shaped error is the positive case, `null`, a string, and an ordinary error are the negatives, and a returning task is the control.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, and drives the `@nestia/fetcher` operation in-process with a stubbed `connection.fetch`, so no server or socket is involved.
 */
export function test_fetcher_simulator_rethrow(): void {
  const asserter = NestiaSimulator.assert({
    host: "http://localhost",
    path: "/items",
    method: "POST",
    contentType: "application/json",
  });

  const guard: Error = Object.assign(new Error("invalid"), {
    method: "typia.assert",
    path: "$input.title",
    expected: "string",
    value: 1,
  });
  let caught: unknown = null;
  try {
    asserter.body(() => {
      throw guard;
    });
  } catch (exp) {
    caught = exp;
  }
  if (!(caught instanceof HttpError) || caught.status !== 400)
    throw new Error(`a type guard error was not a 400: ${String(caught)}.`);
  if (caught.message.includes("$input.title") === false)
    throw new Error(`the 400 does not name the path: ${caught.message}.`);

  const plain: Error = new Error("plain");
  for (const thrown of [null, "text", plain]) {
    let surfaced: unknown = undefined;
    try {
      asserter.body(() => {
        throw thrown;
      });
    } catch (exp) {
      surfaced = exp;
    }
    if (surfaced !== thrown)
      throw new Error(`${String(thrown)} surfaced as ${String(surfaced)}.`);
  }
  asserter.body(() => 1);
}
