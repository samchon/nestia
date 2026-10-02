import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

/**
 * Verifies arithmetic RPC results and callback order at the app-routerModule
 * route.
 *
 * Route composition must connect the generated WebSocket client to the same
 * authored calculator after prefix, version or router-module composition.
 *
 * 1. Connect a generated client with a listener recording callback events.
 * 2. Compare each result and the full callback list with independent arithmetic.
 */
export const test_api_websocket_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  const listener: IListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } =
    await api.functional.websocket.calculate.connect(connection, listener);
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
