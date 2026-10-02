import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { ICalcEvent } from "@api/lib/interfaces/ICalcEvent";
import { ICalcEventListener } from "@api/lib/interfaces/ICalcEventListener";

/**
 * Validates the generated consumer result.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that driver arithmetic results and reverse listener event sequence match operations.
 * @evidence contracts/testing.md#independent-expectations Expectations come from JavaScript arithmetic on literal 10 and 5 operands, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns one hundred random operations; this does not guarantee every operator or invalid-handshake coverage.
 * @evidence contracts/testing.md#execution-ownership The websocket-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The websocket-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the websocket-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted one hundred random operations; this does not guarantee every operator or invalid-handshake coverage distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_calculate_simple = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: ICalcEvent[] = [];
  const listener: ICalcEventListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } = await api.functional.calculate.simple(
    {
      ...connection,
      headers: {
        precision: 2,
      },
    },
    {
      provider: listener,
    },
  );
  const expected = new Array(100).fill(0).map(() => {
    const type = typia.random<"plus" | "minus" | "multiplies" | "divides">();
    const x: number = 10;
    const y: number = 5;
    return {
      type,
      input: [x, y],
      output:
        type === "plus"
          ? x + y
          : type === "minus"
            ? x - y
            : type === "divides"
              ? x / y
              : type === "multiplies"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.type](e.input[0]!, e.input[1]!);
      TestValidator.equals("result", z, e.output);
    }
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
