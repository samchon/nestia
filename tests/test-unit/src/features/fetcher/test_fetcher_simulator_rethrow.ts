import { HttpError, NestiaSimulator } from "@nestia/fetcher";

/**
 * Verifies the simulator turns only a typia type guard error into a 400, and
 * rethrows everything else as it was, including a thrown `null`.
 *
 * Unguarded property reads replaced null/undefined or a record with an
 * unreadable property with a different error. Re-reading a valid getter could
 * also change the metadata between classification and payload construction.
 *
 * 1. Run a body assertion whose task throws a type-guard-shaped error, and assert
 *    an `HttpError` of status 400 whose body names the expectation.
 * 2. Require seven readable metadata/payload getters to be read once.
 * 3. Run all four validators with primitives, ordinary errors and unreadable
 *    fields, requiring original thrown identity and a passing successful task.
 *
 * @evidence contracts/testing.md#behavioral-verification The body validator retains its exact status400 JSON oracle and a readable-getter fixture must produce it with one read per field. Parameter/query/body/header validators must rethrow every unrelated or unreadable value with original identity, including undefined through an explicit didThrow guard.
 * @evidence contracts/testing.md#independent-expectations Only a validation failure becomes a 400 and any other throw belongs to the caller; the assertions compare identity with the thrown value.
 * @evidence contracts/testing.md#distinguishing-cases A plain readable guard and a seven-getter readable guard are positive. Null, undefined, string, number, boolean, bigint, symbol, an ordinary error, null-prototype records and each unreadable method/path/expected/name/message/stack/value field retain identity across all four validators; successful tasks are controls.
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

  const fields = {
    method: "typia.assert",
    path: "$input.title",
    expected: "string",
    name: "Error",
    message: "invalid",
    stack: "stack",
    value: 1,
  };
  const reads = new Map<string, number>();
  const readable = { ...fields };
  for (const [key, value] of Object.entries(fields))
    Object.defineProperty(readable, key, {
      get: () => {
        reads.set(key, (reads.get(key) ?? 0) + 1);
        return value;
      },
    });
  caught = null;
  try {
    asserter.body(() => {
      throw readable;
    });
  } catch (exp) {
    caught = exp;
  }
  if (
    !(caught instanceof HttpError) ||
    caught.status !== 400 ||
    JSON.stringify(JSON.parse(caught.message)) !== JSON.stringify(expected)
  )
    throw new Error("Readable metadata did not preserve the 400 payload.");
  for (const key of Object.keys(fields))
    if (reads.get(key) !== 1)
      throw new Error(
        `${key} was read ${reads.get(key)} times instead of once.`,
      );

  const unreadable: Array<[string, unknown]> = Object.keys(fields).map(
    (key) => [
      `unreadable ${key}`,
      Object.defineProperty({ ...fields }, key, {
        get: () => {
          throw new Error(`Unreadable ${key}`);
        },
      }),
    ],
  );

  const plain: Error = new Error("plain");
  const thrownValues: Array<[string, unknown]> = [
    ["null", null],
    ["undefined", undefined],
    ["string", "text"],
    ["number", 0],
    ["boolean", false],
    ["bigint", 1n],
    ["symbol", Symbol("failure")],
    ["ordinary error", plain],
    ["null prototype", Object.create(null)],
    ...unreadable,
  ];
  for (const [title, thrown] of thrownValues)
    for (const [kind, validate] of [
      ["param", asserter.param("title")],
      ["query", asserter.query],
      ["body", asserter.body],
      ["headers", asserter.headers],
    ] as const) {
      let surfaced: unknown = undefined;
      let didThrow: boolean = false;
      try {
        validate(() => {
          throw thrown;
        });
      } catch (exp) {
        didThrow = true;
        surfaced = exp;
      }
      if (!didThrow || surfaced !== thrown)
        throw new Error(
          `${kind}: ${title} did not retain the original thrown value.`,
        );
      validate(() => 1);
    }
}
