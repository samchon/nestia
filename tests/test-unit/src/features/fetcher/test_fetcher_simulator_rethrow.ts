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
 * 2. Run tasks that throw non-object values and a plain error, and assert each
 *    surfaces exactly as thrown.
 * 3. Run a task that returns, and assert it passes.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the body assertion of `NestiaSimulator` with a type-guard-shaped error and requires status400 and the literal JSON validation body; unrelated thrown values must actually throw and retain identity, including undefined rather than passing via an unset capture.
 * @evidence contracts/testing.md#independent-expectations Only a validation failure becomes a 400 and any other throw belongs to the caller; the assertions compare identity with the thrown value.
 * @evidence contracts/testing.md#distinguishing-cases The guard-shaped error is positive; null, undefined, string, number, boolean, bigint, symbol and an ordinary error must be rethrown without conversion, and a returning task is the control.
 * @evidence contracts/testing.md#execution-ownership Unit: DynamicExecutor discovers it in test-unit and it drives the public simulator assertion with caller-owned closures in-process; there is no fetch operation, server or socket.
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
  const expected = {
    method: "typia.assert",
    path: "$input.title",
    expected: "string",
    value: 1,
    message: "Request body is not following the promised type.",
  };
  if (JSON.stringify(JSON.parse(caught.message)) !== JSON.stringify(expected))
    throw new Error(`the 400 validation body changed: ${caught.message}.`);

  const plain: Error = new Error("plain");
  for (const thrown of [
    null,
    undefined,
    "text",
    0,
    false,
    1n,
    Symbol("failure"),
    plain,
  ]) {
    let surfaced: unknown = undefined;
    let didThrow: boolean = false;
    try {
      asserter.body(() => {
        throw thrown;
      });
    } catch (exp) {
      didThrow = true;
      surfaced = exp;
    }
    if (!didThrow || surfaced !== thrown)
      throw new Error(`${String(thrown)} surfaced as ${String(surfaced)}.`);
  }
  asserter.body(() => 1);
}
