import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import { v4 } from "uuid";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

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
 */
export const test_api_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  const listener: IListener = {
    on: (e) => events.push(e),
  };
  const id: string = v4();
  const { connector, driver } = await api.functional.calculate.connect(
    connection,
    id,
    listener,
  );
  const expected: IListener.IEvent[] = (
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
