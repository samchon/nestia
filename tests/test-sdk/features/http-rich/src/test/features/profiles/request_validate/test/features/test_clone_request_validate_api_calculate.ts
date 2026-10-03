import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import { v4 } from "uuid";

import { IRequestValidateListener } from "../../../../../../validate/structures/IRequestValidateListener";
import api from "../../api";

/**
 * Verifies the generated websocket driver and listener deliver arithmetic
 * results and ordered callbacks.
 *
 * The RPC connection and callback delivery cross the generated client/server
 * websocket boundary; connection teardown belongs to the finally block.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert four operators with x=10 and y=5 are checked by arithmetic
 *    expressions, getId preserves the supplied UUID, and listener events equal
 *    the authored request sequence.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated WebSocket driver preserves the supplied UUID, four independent arithmetic results and the complete ordered listener-event array.
 * @evidence contracts/testing.md#independent-expectations Authored x=10/y=5 arithmetic and the literal operator sequence define result and callback expectations; getId must equal the supplied UUID.
 * @evidence contracts/testing.md#distinguishing-cases Plus/minus/divide/multiply and four ordered callbacks distinguish provider and listener paths; the original connector closes in finally.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IRequestValidateListener.IEvent[] = [];
  const listener: IRequestValidateListener = {
    on: (e) => events.push(e),
  };
  const id: string = v4();
  const { connector, driver } =
    await api.functional.http_rich.options.request_validate.calculate.connect(
      connection,
      id,
      listener,
    );
  const expected: IRequestValidateListener.IEvent[] = (
    ["plus", "minus", "divide", "multiply"] as const
  ).map((operator) => {
    const x: number = 10;
    const y: number = 5;
    return {
      operator,
      x,
      y,
      z:
        operator === "plus"
          ? x + y
          : operator === "minus"
            ? x - y
            : operator === "divide"
              ? x / y
              : operator === "multiply"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.operator](e.x, e.y);
      TestValidator.equals("result", z, e.z);
    }
    await TestValidator.equals("id", id, await driver.getId());
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
