import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

/**
 * Verifies WebSocket clone SDKs import provider/listener contracts from
 * generated structures instead of source interfaces.
 *
 * Locks the regression where `@WebSocketRoute.Acceptor()` interfaces stayed
 * imported from the application `src/` tree. Compiling a distributed SDK would
 * then pull source files into `lib/`; using the generated structure type here
 * proves the clone path exports and consumes the listener contract.
 *
 * 1. Connect to the generated WebSocket SDK with a structure-imported listener.
 * 2. Call calculator driver methods through the generated SDK.
 * 3. Assert both RPC return values and listener events preserve the contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that clone SDK's structure-imported listener receives events matching arithmetic driver results.
 * @evidence contracts/testing.md#independent-expectations Expectations come from arithmetic on literal operands plus the generated listener type import, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns one hundred random operations without guaranteed operator coverage; clone structure imports distinguish this fixture.
 * @evidence contracts/testing.md#execution-ownership The websocket-clone fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The websocket-clone runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the websocket-clone fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted one hundred random operations without guaranteed operator coverage; clone structure imports distinguish this fixture distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  const listener: IListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } = await api.functional.calculate.connect(
    connection,
    listener,
  );
  const expected: IListener.IEvent[] = new Array(100).fill(0).map(() => {
    const operator = typia.random<IListener.IEvent["operator"]>();
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
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
